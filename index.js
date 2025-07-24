import fs from "fs"

import uWS from "uWebSockets.js"

import config from "./app/config/index.js"
import ServiceLocatorContainer from "./app/common/ServiceLocatorContainer.js"
import providers from "./app/providers/index.js"
import RegisterProvider from "./app/common/RegisterProvider.js"

import clusterManager from "./app/cluster/cluster_manager.js"
import clusterSyncer from "./app/cluster/cluster_syncer.js"

import WsProtocol from "./app/networking/protocol_processors/ws.js"
import TcpProtocol from "./app/networking/protocol_processors/tcp.js"
import HttpProtocol from "./app/networking/protocol_processors/http.js"

import { connectToDBPromise } from "./app/lib/db.js"
import RedisClient from "./app/lib/redis.js"
import Logger from "./app/utils/logger.js"

import { APIs } from "./app/networking/APIs.js"

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

console.log("[Config]", JSON.stringify(config.toObject(), null, 5))

// perform a database connection when the server starts
const dbConnection = await connectToDBPromise(config.get("db.mongo.main.url"))
  .then((dbConnection) => {
    console.log("[Mongo][connect] Ok")
    return dbConnection
  })
  .catch((err) => {
    console.log("[Mongo][connect] error", err)
    process.exit()
  })

await RedisClient.connect()
  .then(async () => {
    Logger.redis("connect", "ok", "Redis connection established")
  })
  .catch((err) => {
    Logger.redisError("connect", "error", err)
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
console.log("[Register base]")

for (const provider of providers) {
  ServiceLocatorContainer.register(provider)
}

for (const api of Object.values(APIs)) {
  console.log("[Register Api Providers]", api.constructor.name)

  config.merge(api.config)

  for (const provider of api.providers) {
    ServiceLocatorContainer.register(provider)
  }
}

console.log("[Config][Merged]", JSON.stringify(config.toObject(), null, 5))

// Boot providers
console.log("[Boot]")
await ServiceLocatorContainer.boot()

console.log("[Create singleton]")
await ServiceLocatorContainer.createAllSingletonInstances()

// Start Cluster Sync
console.log("[Start sync]")
await clusterSyncer.startSyncingClusterNodes()

// Start public protocols
const sessionService = ServiceLocatorContainer.use("SessionService")
const conversationService = ServiceLocatorContainer.use("ConversationService")

const wsProtocolImp = new WsProtocol(sessionService, conversationService)
await wsProtocolImp.listen(uWSOptions)

const httpProtocolImp = new HttpProtocol(sessionService, conversationService, wsProtocolImp.uWSocket)
await httpProtocolImp.listen({})

const tcpProtocolImp = new TcpProtocol(sessionService, conversationService)
await tcpProtocolImp.listen(tcpOptions)

// https://dev.to/mattkrick/replacing-express-with-uwebsockets-48ph

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  Logger.shutdown("start", `Received ${signal}, starting graceful shutdown...`)
  
  try {
    // Close Redis connection
    await RedisClient.disconnect()
    Logger.shutdown("redis", "Redis disconnected")
    
    Logger.shutdown("complete", "Graceful shutdown completed")
    process.exit(0)
  } catch (error) {
    Logger.shutdownError("graceful", error)
    process.exit(1)
  }
}

// Handle different shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')) // For nodemon restart

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  Logger.error(`[Uncaught Exception] ${error.message}`, error)
  gracefulShutdown('uncaughtException')
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  Logger.error(`[Unhandled Rejection] ${reason}`, reason)
  gracefulShutdown('unhandledRejection')
})
