/* Simplified stock exchange made with uWebSockets.js pub/sub */
import ip from "ip"
import os from "os"

import uWS from "uWebSockets.js"

import RuntimeDefinedContext from "./app/store/RuntimeDefinedContext.js"
import ServiceLocatorContainer from "./app/common/ServiceLocatorContainer.js"
import providers from "./app/providers/index.js"
import RegisterProvider from "./app/common/RegisterProvider.js"

import clusterManager from "./app/cluster/cluster_manager.js"
import clusterSyncer from "./app/cluster/cluster_syncer.js"

import clientManager from "./app/networking/client_manager.js"

// get MongoDB driver connection
import Minio from "./app/lib/storage/minio.js"
import S3 from "./app/lib/storage/s3.js"
import Spaces from "./app/lib/storage/spaces.js"

import { connectToDBPromise } from "./app/lib/db.js"
import RedisClient from "./app/lib/redis.js"

import { APIs } from "./app/networking/APIs.js"

RuntimeDefinedContext.APP_HOSTNAME = process.env.HOSTNAME || os.hostname()
RuntimeDefinedContext.APP_IP = ip.address()

switch (process.env.STORAGE_DRIVER) {
  case "minio":
    RuntimeDefinedContext.STORAGE_DRIVER = new Minio()
    break
  case "spaces":
    RuntimeDefinedContext.STORAGE_DRIVER = new Spaces()
    break
  default:
    RuntimeDefinedContext.STORAGE_DRIVER = new S3()
    break
}

const APP_OPTIONS = {}
const SSL_APP_OPTIONS = {
  key_file_name: process.env.SSL_KEY_FILE_NAME,
  cert_file_name: process.env.SSL_CERT_FILE_NAME,
}
const WS_OPTIONS = {
  compression: uWS.SHARED_COMPRESSOR,
  idleTimeout: 12,
  maxBackpressure: 1024,
  maxPayloadLength: 16 * 1024 * 1024,
}
const WS_LISTEN_OPTIONS = {
  LIBUS_LISTEN_EXCLUSIVE_PORT: 1,
}
const isSSL = !!SSL_APP_OPTIONS.key_file_name && !!SSL_APP_OPTIONS.cert_file_name
const appPort = parseInt(process.env.APP_PORT || process.env.PORT)

await clientManager.createLocalSocket(
  isSSL ? SSL_APP_OPTIONS : APP_OPTIONS,
  WS_OPTIONS,
  WS_LISTEN_OPTIONS,
  isSSL,
  appPort
)

RuntimeDefinedContext.CLUSTER_PORT = await clusterManager.createLocalSocket(
  isSSL ? SSL_APP_OPTIONS : APP_OPTIONS,
  WS_OPTIONS,
  WS_LISTEN_OPTIONS,
  isSSL
)

console.log("[RuntimeDefinedContext]", RuntimeDefinedContext)

// perform a database connection when the server starts
const dbConnection = await connectToDBPromise(process.env.MONGODB_URL)
  .then((dbConnection) => {
    console.log("[Mongo][connect] Ok")
    return dbConnection
  })
  .catch((err) => {
    console.log("[Mongo][connect] error", err)
    process.exit()
  })

await RedisClient.connect()
  .then(() => {
    console.log("[Redis][connect] Ok")
  })
  .catch((err) => {
    console.log("[Redis][connect] error", err)
    process.exit()
  })

// Register providers
ServiceLocatorContainer.register(
  new (class extends RegisterProvider {
    register(slc) {
      return RuntimeDefinedContext
    }
  })({
    name: "RuntimeDefinedContext",
    implementationName: RuntimeDefinedContext.name,
    scope: RegisterProvider.SCOPE.SINGLETON,
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
    scope: RegisterProvider.SCOPE.SINGLETON,
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
    scope: RegisterProvider.SCOPE.SINGLETON,
  })
)
ServiceLocatorContainer.register(
  new (class extends RegisterProvider {
    register(slc) {
      return RuntimeDefinedContext.STORAGE_DRIVER
    }
  })({ name: "StorageDriverClient", implementationName: RuntimeDefinedContext.STORAGE_DRIVER.constructor.name })
)

for (const provider of providers) {
  ServiceLocatorContainer.register(provider)
}

for (const api of Object.values(APIs)) {
  for (const provider of api.providers) {
    ServiceLocatorContainer.register(provider)
  }
}

// Boot providers
await ServiceLocatorContainer.createAllSingletonInstances()
await ServiceLocatorContainer.boot()

// Start Cluster Sync

await clusterSyncer.startSyncingClusterNodes()

// https://dev.to/mattkrick/replacing-express-with-uwebsockets-48ph
