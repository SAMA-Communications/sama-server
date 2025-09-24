import fs from "node:fs"

import uWS from "uWebSockets.js"

import config from "./app/config/index.js"
import logger from "./app/logger/index.js"

import ServiceLocatorContainer from "./app/common/ServiceLocatorContainer.js"
import RegisterProvider from "./app/common/RegisterProvider.js"
import providers from "./app/providers/index.js"

import clusterManager from "./app/cluster/cluster_manager.js"
import clusterSyncer from "./app/cluster/cluster_syncer.js"

import WsProtocol from "./app/networking/protocol_processors/ws.js"
import TcpProtocol from "./app/networking/protocol_processors/tcp.js"
import HttpProtocol from "./app/networking/protocol_processors/http.js"

import { connectToDBPromise } from "./app/lib/db.js"
import RedisClient from "./app/lib/redis.js"

import { APIs } from "./app/networking/APIs.js"

import { buildWsEndpoint } from "./app/utils/build_ws_endpoint.js"

logger.debug("[App staring] %s", process.pid)

const uWS_SSL_OPTIONS = {
  key_file_name: config.get("ws.options.ssl.key"),
  cert_file_name: config.get("ws.options.ssl.cert"),
}

const uWSOptions = {
  appOptions: config.get("ws.options.isSecure") ? uWS_SSL_OPTIONS : {},
  wsOptions: {
    compression: uWS.SHARED_COMPRESSOR,
    idleTimeout: 12,
    maxBackpressure: 1024,
    maxPayloadLength: 16 * 1024 * 1024,
  },
  listenOptions: {
    LIBUS_LISTEN_EXCLUSIVE_PORT: 1,
  },
  isSSL: config.get("ws.options.isSecure"),
  port: parseInt(config.get("ws.api.port")),
}

const tcpOptions = {
  port: parseInt(config.get("tcp.api.port")),
}
if (config.get("tcp.options.isTls")) {
  Object.assign(tcpOptions, {
    key: fs.readFileSync(config.get("tcp.options.tls.key")),
    cert: fs.readFileSync(config.get("tcp.options.tls.cert")),
  })
}

const clusterPort = await clusterManager.createLocalSocket(uWSOptions)
config.set("ws.cluster.port", clusterPort)
config.set("ws.cluster.endpoint", buildWsEndpoint(config.get("app.ip"), config.get("ws.cluster.port")))

logger.debug("[Config] %s", JSON.stringify(config.toObject(), null, 5))

// perform a database connection when the server starts
const dbConnection = await connectToDBPromise(config.get("db.mongo.main.url"))
  .then((dbConnection) => {
    logger.debug("[Mongo][connect] Ok")
    return dbConnection
  })
  .catch((err) => {
    logger.error(err, "[Mongo][connect]")
    process.exit()
  })

await RedisClient.connect()
  .then(async () => {
    logger.debug("[Redis][connect] Ok")
  })
  .catch((err) => {
    logger.error(err, "[Redis][connect]")
    process.exit()
  })

// Register providers
ServiceLocatorContainer.register(
  new (class extends RegisterProvider {
    register(slc) {
      return config
    }
  })({
    name: "Config",
    implementationName: config.constructor.name,
  })
)
ServiceLocatorContainer.register(
  new (class extends RegisterProvider {
    register(slc) {
      return logger
    }
  })({
    name: "Logger",
    implementationName: logger.constructor.name,
  })
)
ServiceLocatorContainer.register(
  new (class extends RegisterProvider {
    register(slc) {
      return RedisClient
    }
  })({
    name: "RedisClient",
    implementationName: RedisClient.constructor.name,
  })
)
ServiceLocatorContainer.register(
  new (class extends RegisterProvider {
    register(slc) {
      return dbConnection
    }
  })({
    name: "MongoConnection",
    implementationName: "MongoConnection",
  })
)

logger.debug("[Register base]")

for (const provider of providers) {
  ServiceLocatorContainer.register(provider)
}

for (const api of Object.values(APIs)) {
  logger.debug("[Register Api Providers] %s", api.constructor.name)

  config.merge(api.config)

  for (const provider of api.providers) {
    ServiceLocatorContainer.register(provider)
  }
}

logger.debug("[Config][Merged] %s", JSON.stringify(config.toObject(), null, 5))

// Boot providers
logger.debug("[Boot]")
await ServiceLocatorContainer.boot()

logger.debug("[Create singleton]")
await ServiceLocatorContainer.createAllSingletonInstances()

// Start Cluster Sync
logger.debug("[Start sync]")
await clusterSyncer.startSyncingClusterNodes()

// Start public protocols
const sessionService = ServiceLocatorContainer.use("SessionService")
const conversationService = ServiceLocatorContainer.use("ConversationService")

const wsProtocolImp = new WsProtocol(sessionService, conversationService)
await wsProtocolImp.listen(uWSOptions)

const httpProtocolImp = new HttpProtocol(sessionService, conversationService, wsProtocolImp.uWSocketServer)
await httpProtocolImp.listen({})

const tcpProtocolImp = new TcpProtocol(sessionService, conversationService)
await tcpProtocolImp.listen(tcpOptions)

// https://dev.to/mattkrick/replacing-express-with-uwebsockets-48ph
