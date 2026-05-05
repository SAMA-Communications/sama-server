import fs from "node:fs"

import uWS from "uWebSockets.js"

import { CONSTANTS } from "./app/constants/constants.js"
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
import OTPSender from "./app/lib/otp_sender.js"

import { APIs } from "./app/networking/APIs.js"

import { buildWsEndpoint } from "./app/utils/build_ws_endpoint.js"
import { socketCloseWatchdog } from "./app/utils/socket-close-watchdog.js"

if (config.get("app.env") === CONSTANTS.ENVS.PROD) {
  process.on("unhandledRejection", (reason, promise) => {
    logger.fatal(reason, "[unhandledRejection] %o", promise)
  })

  process.on("uncaughtException", (error, nodeError) => {
    logger.fatal(error, "[uncaughtException] %o", nodeError)
  })
}

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

if (!config.get("app.isStandAloneNode")) {
  const clusterPort = await clusterManager.createLocalSocket(uWSOptions)
  config.set("ws.cluster.port", clusterPort)
}
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

const optSender = new OTPSender()

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
ServiceLocatorContainer.register(
  new (class extends RegisterProvider {
    register(slc) {
      return optSender
    }
  })({
    name: "OptSender",
    implementationName: OTPSender.name,
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

if (!config.get("app.isStandAloneNode")) {
  // Start Cluster Sync
  logger.debug("[Start sync]")
  await clusterSyncer.startSyncingClusterNodes()
}

// Start public protocols
const sessionService = ServiceLocatorContainer.use("SessionService")
const conversationService = ServiceLocatorContainer.use("ConversationService")

const wsProtocolImp = new WsProtocol(sessionService, conversationService)
await wsProtocolImp.listen(uWSOptions)

const httpProtocolImp = new HttpProtocol(sessionService, conversationService, wsProtocolImp.uWSocketServer)
await httpProtocolImp.listen({})

// https://dev.to/mattkrick/replacing-express-with-uwebsockets-48ph

let tcpProtocolImp = void 0
if (config.get("tcp.isEnabled")) {
  tcpProtocolImp = new TcpProtocol(sessionService, conversationService)
  await tcpProtocolImp.listen(tcpOptions)
}

if (config.get("app.socketCloseWatchdogInterval")) {
  const socketCloseWatchdogLogger = logger.child("[SocketClosedWatchDog]")
  setInterval(() => {
    socketCloseWatchdog(
      socketCloseWatchdogLogger,
      sessionService,
      (socket, code) => wsProtocolImp.onClose(socket, code),
      (socket) => tcpProtocolImp.onClose(socket)
    )
  }, config.get("app.socketCloseWatchdogInterval"))
}

process.stdin.setEncoding('utf8')
process.stdin.on('data', (data) => {
  try {
    const cmd = data.trim()
    console.log('[Cmd]', cmd)
  
    const sessionService = ServiceLocatorContainer.use("SessionService")
    // const findSocketByUserId = userId => {
    //   for (const socket of sessionService.activeSessions.SESSIONS.keys()) {
    //     const userData = sessionService.activeSessions.SESSIONS.get(socket)
  
    //     if (userData?.userId === userId) {
    //       return socket
    //     }
    //   }
    // }
  
    if (cmd.match(/cmd-ping/i)) { // 'cmd-ping 1111'
      const matchRes = cmd.match(/cmd-ping (.+)/i)
      const userId = +matchRes.at(1)
  
      console.log('[PingWS]', userId, '[devices]', sessionService.listUserDeviceLocal(userId))
  
      const connections = sessionService.getUserDevices(userId)

      for (const connection of connections) {
        console.log('[PingWS][start]', connection?.socket)

        let sendResult = void 0
        try {
          sendResult = connection?.socket?.ping(" ")
        } catch (err) {
          console.log('[Cmd][error]', err)
        }
  
        console.log('[PingWS][result]', connection?.socket, sendResult)
      }
    }
  
    if (cmd.match(/cmd-send/i)) { // 'cmd-send 1111 test'
      const matchRes = cmd.match(/cmd-send ([^\s]+) (.+)/i)
      const userId = +matchRes.at(1)
      const sendData = matchRes.at(2)
  
      console.log('[SendWS]', userId, sendData, '[devices]', sessionService.listUserDeviceLocal(userId))
  
      const connections = sessionService.getUserDevices(userId)

      for (const connection of connections) {
        console.log('[SendWS][start]', connection?.socket)

        let sendResult = void 0
        try {
          sendResult = connection?.socket?.send(sendData)
        } catch (err) {
          console.log('[Cmd][error]', err)
        }
  
        console.log('[SendWS][result]', connection?.socket, sendResult)
      }
    }

    if (cmd.match(/cmd-close/i)) { // 'cmd-close 1111'
      const matchRes = cmd.match(/cmd-close (.+)/i)
      const userId = +matchRes.at(1)
  
      console.log('[CloseWS]', userId, '[devices]', sessionService.listUserDeviceLocal(userId))
  
      const connections = sessionService.getUserDevices(userId)

      for (const connection of connections) {
        console.log('[CloseWS][start]', connection?.socket)

        let sendResult = void 0
        try {
          sendResult = connection?.socket?.close()
        } catch (err) {
          console.log('[Cmd][error]', err)
        }
  
        console.log('[CloseWS][result]', connection?.socket, sendResult)
      }
    }
  } catch (error) {
    console.log('[Cmd][error]', error)
  }
})
