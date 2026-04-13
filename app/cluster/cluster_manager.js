import { StringDecoder } from "node:string_decoder"

import WebSocket from "ws"
import uWS from "uWebSockets.js"

import config from "../config/index.js"
import mainLogger from "../logger/index.js"

import BaseProtocolProcessor from "../networking/protocol_processors/base.js"

import ServiceLocatorContainer from "../common/ServiceLocatorContainer.js"

import activitySender from "../networking/activity_sender.js"
import packetManager from "../networking/packet_manager.js"

import { promiseQueueWithJittering, CancelQueueError } from "../utils/promise-queue-with-jittering.js"

const logger = mainLogger.child("[ClusterManager]")
const loggerSync = logger.child("[Sync]")
const loggerSender = logger.child("[Sender]")
const loggerReceiver = logger.child("[Receiver]")

const decoder = new StringDecoder("utf8")

const DUPLICATE_CLOSE_WS_CODE = 1004
const DUPLICATE_CLOSE_WS_REASON = "Duplicate"

class ReconnectManager {
  nodeEndpoint = void 0

  startFn = void 0
  cancelFn = void 0

  isFinished = false

  constructor(nodeEndpoint, promiseFn) {
    this.nodeEndpoint = nodeEndpoint

    const { start, cancel } = promiseQueueWithJittering(promiseFn, 3, 1_000)

    this.startFn = start
    this.cancelFn = cancel
  }

  start() {
    return this.startFn?.()
  }

  cancel() {
    this.cancelFn?.()

    this.startFn = void 0
    this.cancelFn = void 0

    this.isFinished = true
  }
}

class ClusterManager extends BaseProtocolProcessor {
  #nodesSyncInterval = void 0

  #localSocket = void 0

  clusterNodesConnections = new Map()
  reconnectingNodesConnections = new Map()

  async startSyncingClusterNodes(isColdStart) {
    if (this.#nodesSyncInterval) {
      return
    }

    if (isColdStart) {
      await this.cleanDestroyedNodeData(config.get("ws.cluster.endpoint"))
    }

    this.#nodesSyncInterval = setInterval(() => this.#syncCluster(), config.get("ws.cluster.nodeExpiresIn"))

    if (isColdStart) {
      await this.#syncCluster()
    }
  }

  async stopSyncingClusterNodes() {
    clearInterval(this.#nodesSyncInterval)
    this.#nodesSyncInterval = void 0
  }

  async #syncCluster() {
    const sessionService = ServiceLocatorContainer.use("SessionService")

    await this.#storeCurrentNode(sessionService.totalSessions())

    await this.#connectToExistingClusterNodes()
  }

  async #storeCurrentNode(usersCount) {
    const clusterNodeService = ServiceLocatorContainer.use("ClusterNodeService")

    const addressParams = {
      ip_address: config.get("app.ip"),
      hostname: config.get("app.hostName"),
      port: config.get("ws.cluster.port"),
    }

    const optionalParams = {
      users_count: usersCount,
    }

    await clusterNodeService.upsert(addressParams, optionalParams)
  }

  async #connectToExistingClusterNodes() {
    const destroyedNodes = new Set()

    loggerSender.debug("[Start]")
    loggerSync.debug("[connections] %j %s", Array.from(this.clusterNodesConnections.keys()), this.clusterNodesConnections.size)
    loggerSync.debug("[reconnecting] %j %s", Array.from(this.reconnectingNodesConnections.keys()), this.reconnectingNodesConnections.size)

    const clusterNodeService = ServiceLocatorContainer.use("ClusterNodeService")

    const activeNodes = await clusterNodeService.retrieveActive()
    loggerSync.debug("[active] %j %s", Array.from(activeNodes), activeNodes.size)

    const storedNodes = await clusterNodeService.retrieveStored()
    loggerSync.debug("[stored] %j %s", Array.from(storedNodes), storedNodes.size)

    // check node-users stored and no active
    storedNodes.forEach((storedNode) => {
      if (!activeNodes.has(storedNode)) {
        destroyedNodes.add(storedNode)
      }
    })

    // check ws closed and not active
    for (const clusterNode of this.reconnectingNodesConnections.keys()) {
      if (!activeNodes.has(clusterNode)) {
        destroyedNodes.add(clusterNode)
      }
    }

    // check current connects but not active (probable ws close did not call)
    for (const clusterNode of this.clusterNodesConnections.keys()) {
      if (!activeNodes.has(clusterNode)) {
        destroyedNodes.add(clusterNode)
      }
    }

    for (const nodeEndpoint of activeNodes) {
      const isCurrentNode = config.get("ws.cluster.endpoint") === nodeEndpoint
      if (isCurrentNode) {
        continue
      }

      const existingReconnectManager = this.reconnectingNodesConnections.get(nodeEndpoint)
      if (existingReconnectManager && !existingReconnectManager.isFinished) {
        continue
      }

      try {
        loggerSync.debug("[establish connect with node] %s", nodeEndpoint)
        await this.createOrRetrieveConnectionWithNode(nodeEndpoint, true)
        loggerSync.debug("[connected] %s", nodeEndpoint)
      } catch (error) {
        loggerSync.error(error, "[connect node][failed] %s", nodeEndpoint)
        this.startNodeReconnecting(nodeEndpoint, false)
      }
    }

    for (const nodeEndpoint of destroyedNodes) {
      await this.cleanDestroyedNodeData(nodeEndpoint)
    }
  }

  #shareCurrentNodeInfo(ws) {
    ws.send(
      JSON.stringify({
        node_info: {
          endpoint: config.get("ws.cluster.endpoint"),
          ip: config.get("app.ip"),
          host: config.get("app.hostName"),
          port: config.get("ws.cluster.port"),
        },
      })
    )
  }

  async createOrRetrieveConnectionWithNode(nodeEndpoint, throwIfActiveReconnect) {
    const existingWS = this.clusterNodesConnections.get(nodeEndpoint)
    if (existingWS) {
      return existingWS
    }

    if (throwIfActiveReconnect && this.reconnectingNodesConnections.has(nodeEndpoint)) {
      throw new Error("Node reconnecting")
    }

    loggerSender.debug("[connect node] %s", nodeEndpoint)

    const ws = await this.createConnectionWithNode(nodeEndpoint)

    this.cancelNodeReconnecting(nodeEndpoint)

    loggerSender.debug("[connect node][success] %s", nodeEndpoint)

    if (this.clusterNodesConnections.get(nodeEndpoint)) {
      ws.close(DUPLICATE_CLOSE_WS_CODE, DUPLICATE_CLOSE_WS_REASON)
      return this.clusterNodesConnections.get(nodeEndpoint)
    }

    this.clusterNodesConnections.set(nodeEndpoint, ws)

    return ws
  }

  async createConnectionWithNode(nodeEndpoint) {
    const nodeSederLogger = loggerSender.child(`[${nodeEndpoint}]`)

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(nodeEndpoint)

      ws.nodeEndpoint = nodeEndpoint

      ws.on("error", async (event) => {
        nodeSederLogger.error(event, "[error]")
        reject(new Error(`Error on ${nodeEndpoint}`))
      })

      ws.on("open", async () => {
        nodeSederLogger.debug("[Open] %s", ws.nodeEndpoint)
        ws.isWasOpened = true
        this.#shareCurrentNodeInfo(ws)
      })

      ws.on("message", async (data) => {
        const clusterPacket = JSON.parse(decoder.write(Buffer.from(data)))

        nodeSederLogger.trace("[packet] %j", clusterPacket)

        if (clusterPacket.node_info) {
          const nodeInfo = clusterPacket.node_info
          nodeSederLogger.debug("[node handshake finished] %s", nodeInfo.endpoint)
          resolve(ws)
          return
        }
      })

      ws.on("close", (code, reason) => {
        reason = reason.toString("utf-8")
        nodeSederLogger.debug("[Close][%s] IsWasOpened: %s Code: %s Reason: %s", ws.nodeEndpoint, ws.isWasOpened, code, reason)

        if (!ws.isWasOpened) {
          return
        }

        this.onCloseNode(ws.nodeEndpoint, +code, reason)
      })
    })
  }

  async startNodeReconnecting(nodeEndpoint, skipIfHashActiveReconnection) {
    if (skipIfHashActiveReconnection && this.reconnectingNodesConnections.has(nodeEndpoint)) {
      return
    }

    const reconnectLogger = logger.child(`[Reconnecting][${nodeEndpoint}]`)
    reconnectLogger.debug("[start]")

    this.cancelNodeReconnecting(nodeEndpoint)

    const connectFn = () => this.createOrRetrieveConnectionWithNode(nodeEndpoint, false)
    const reconnectManager = new ReconnectManager(nodeEndpoint, connectFn)

    this.reconnectingNodesConnections.set(nodeEndpoint, reconnectManager)

    try {
      const result = await reconnectManager.start()

      reconnectLogger.debug("[finish]")

      this.cancelNodeReconnecting(nodeEndpoint, true)

      return result
    } catch (error) {
      reconnectLogger.error(error, "[error]")
      reconnectManager.cancel()
    }
  }

  cancelNodeReconnecting(nodeEndpoint, isSuccess) {
    if (!isSuccess) {
      const existingReconnectManager = this.reconnectingNodesConnections.get(nodeEndpoint)
      existingReconnectManager?.cancel?.()
    }

    this.reconnectingNodesConnections.delete(nodeEndpoint)
  }

  async createLocalSocket({ isSSL, appOptions, wsOptions, listenOptions }) {
    return new Promise((resolve) => {
      this.#localSocket = isSSL ? uWS.SSLApp(appOptions) : uWS.App(appOptions)

      this.#localSocket.ws("/*", {
        ...wsOptions,

        open: (ws) => {
          loggerReceiver.debug("[Open] IP: %s", Buffer.from(ws.getRemoteAddressAsText()).toString())
        },

        message: async (ws, message, isBinary) => {
          const clusterPacket = JSON.parse(decoder.write(Buffer.from(message)))

          loggerReceiver.trace("[packet] %j", clusterPacket)

          if (clusterPacket.node_info) {
            const nodeInfo = clusterPacket.node_info
            ws.nodeEndpoint = nodeInfo.endpoint

            loggerReceiver.debug("[node handshake pong] %s", nodeInfo.endpoint)
            this.#shareCurrentNodeInfo(ws)

            await this.createOrRetrieveConnectionWithNode(nodeInfo.endpoint, true).catch((error) =>
              loggerReceiver.error(error, "[create connection on receiver]")
            )
            return
          }

          if (clusterPacket.deliverPacket) {
            await packetManager.deliverClusterMessageToUser(clusterPacket.deliverPacket)
          }
        },

        close: (ws, code, reason) => {
          reason = decoder.write(Buffer.from(reason))
          loggerReceiver.debug("[Close][%s] Code: %s Reason: %s", ws.nodeEndpoint, code, reason)
          this.onCloseNode(ws.nodeEndpoint, +code, reason)
        },
      })

      this.#localSocket.listen(parseInt(config.get("ws.cluster.port")) || 0, listenOptions, (listenSocket) => {
        if (!listenSocket) {
          throw new Error(`[ClusterManager] error: can't allocate port`)
        }

        const clusterPort = uWS.us_socket_local_port(listenSocket)
        loggerReceiver.debug(" listening on port %s", clusterPort)

        return resolve(clusterPort)
      })
    })
  }

  async senderClusterDeliverPacket(nodeEndpoint, deliverPacket) {
    let recipientClusterNodeConnection = this.clusterNodesConnections.get(nodeEndpoint)

    if (!recipientClusterNodeConnection) {
      recipientClusterNodeConnection = await this.createOrRetrieveConnectionWithNode(nodeEndpoint, true)
    }

    const clusterPacket = { deliverPacket }
    loggerSender.trace("[%s][send] %j", nodeEndpoint, clusterPacket)
    recipientClusterNodeConnection.send(JSON.stringify(clusterPacket))
  }

  onCloseNode(nodeEndpoint, closeCode, reason) {
    if (closeCode === DUPLICATE_CLOSE_WS_CODE && reason === DUPLICATE_CLOSE_WS_REASON) {
      return
    }

    this.deleteClusterConnection(nodeEndpoint)
    this.startNodeReconnecting(nodeEndpoint, true)
  }

  deleteClusterConnection(nodeEndpoint) {
    const connections = this.clusterNodesConnections.get(nodeEndpoint)
    this.clusterNodesConnections.delete(nodeEndpoint)
    connections?.close?.()
  }

  async cleanDestroyedNodeData(nodeEndpoint) {
    logger.debug("[clean node] %s", nodeEndpoint)

    this.deleteClusterConnection(nodeEndpoint)
    this.cancelNodeReconnecting(nodeEndpoint)

    const sessionService = ServiceLocatorContainer.use("SessionService")

    const lastUserSessions = await sessionService.clearNodeUsersSession(nodeEndpoint).catch((error) => logger.error(error, "[clean node]"))

    if (!lastUserSessions) {
      return
    }

    const offlineUserResponses = lastUserSessions.map((userSession) =>
      activitySender.buildOfflineActivityResponse(userSession.organizationId, userSession.userId)
    )

    for (const offlineUserResponse of offlineUserResponses) {
      await this.processAPIResponse(void 0, offlineUserResponse)
    }
  }
}

export default new ClusterManager(void 0, void 0)
