import { StringDecoder } from "node:string_decoder"

import WebSocket from "ws"
import uWS from "uWebSockets.js"

import config from "../config/index.js"
import mainLogger from "../logger/index.js"

import BaseProtocolProcessor from "../networking/protocol_processors/base.js"

import ServiceLocatorContainer from "../common/ServiceLocatorContainer.js"

import activitySender from "../networking/activity_sender.js"
import packetManager from "../networking/packet_manager.js"

import { buildWsEndpoint } from "../utils/build_ws_endpoint.js"

const logger = mainLogger.child("[ClusterManager]")
const loggerSender = logger.child("[Sender]")
const loggerReceiver = logger.child("[Receiver]")

const decoder = new StringDecoder("utf8")

class ClusterManager extends BaseProtocolProcessor {
  #nodesSyncInterval = void 0

  #localSocket = void 0
  clusterNodesConnections = {}

  async startSyncingClusterNodes(isColdStart) {
    if (this.#nodesSyncInterval) {
      return
    }

    if (isColdStart) {
      await this.cleanDestroyedNodeData(config.get("ws.cluster.endpoint"))
    }

    this.#nodesSyncInterval = setInterval(() => this.#syncCluster(), config.get("ws.cluster.nodeExpiresIn") - 2_000)

    this.#syncCluster(isColdStart)
  }

  async stopSyncingClusterNodes() {
    clearInterval(this.#nodesSyncInterval)
    this.#nodesSyncInterval = void 0
  }

  async #syncCluster() {
    const sessionService = ServiceLocatorContainer.use("SessionService")

    await this.#storeCurrentNode(sessionService.sessionsTotal)

    await this.#retrieveExistingClusterNodes()
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

    await clusterNodeService.create(addressParams, optionalParams)
  }

  async #retrieveExistingClusterNodes() {
    const clusterNodeService = ServiceLocatorContainer.use("ClusterNodeService")
    const nodeList = await clusterNodeService.retrieveAll()

    loggerSender.debug("[nodes] %j %s", nodeList, nodeList.length)

    const destroyedNodes = []

    for (const nodeInfo of nodeList) {
      const nodeEndpoint = buildWsEndpoint(nodeInfo.ip_address, nodeInfo.port)
      const isCurrentNode = config.get("ws.cluster.endpoint") === nodeEndpoint
      if (isCurrentNode) {
        continue
      }

      try {
        await this.retrieveConnectionWithNode(nodeEndpoint)
      } catch (error) {
        loggerSender.error(error, "[connect node][failed] %s", nodeEndpoint)
        destroyedNodes.push(nodeEndpoint)
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
          port: config.get("ws.cluster.port")
        },
      })
    )
  }

  async retrieveConnectionWithNode(nodeEndpoint) {
    const existingWS = this.clusterNodesConnections[nodeEndpoint]
    if (existingWS) {
      return existingWS
    }

    loggerSender.debug("[connect node] %s", nodeEndpoint)

    return await this.createConnectionWithNode(nodeEndpoint)
  }

  async createConnectionWithNode(nodeEndpoint) {
    const nodeSederLogger = loggerSender.child(`[${nodeEndpoint}]`)

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(nodeEndpoint)

      ws.nodeEndpoint = nodeEndpoint

      ws.on("error", async (event) => {
        nodeSederLogger.error(event, "[error]")
        reject(new Error(`[connection][error] ${nodeEndpoint}`))
      })

      ws.on("open", async () => {
        nodeSederLogger.debug("[Open] %s", ws.nodeEndpoint)
        this.#shareCurrentNodeInfo(ws)
      })

      ws.on("message", async (data) => {
        const clusterPacket = JSON.parse(decoder.write(Buffer.from(data)))

        nodeSederLogger.trace("[packet] %j", clusterPacket)

        if (clusterPacket.node_info) {
          const nodeInfo = clusterPacket.node_info
          this.clusterNodesConnections[nodeInfo.endpoint] = ws

          nodeSederLogger.debug("[node handshake finished] %s", nodeInfo.endpoint)
          resolve(ws)
          return
        }
      })

      ws.on("close", async () => {
        nodeSederLogger.debug("[Close] %s", ws.nodeEndpoint)
        await this.cleanDestroyedNodeData(ws.nodeEndpoint)
      })
    })
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
            this.clusterNodesConnections[nodeInfo.endpoint] = ws

            loggerReceiver.debug("[node handshake finished] %s", nodeInfo.endpoint)
            this.#shareCurrentNodeInfo(ws)
            return
          }

          if (clusterPacket.deliverPacket) {
            await packetManager.deliverClusterMessageToUser(clusterPacket.deliverPacket)
          }
        },

        close: async (ws, code, message) => {
          logger.debug("[Close] %s Code: %s", ws.nodeEndpoint, code)
          await this.cleanDestroyedNodeData(ws.nodeEndpoint)
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

  async senderClusterDeliverPacket(nodeUrl, deliverPacket) {
    let recipientClusterNodeConnection = this.clusterNodesConnections[nodeUrl]

    if (!recipientClusterNodeConnection) {
      recipientClusterNodeConnection = await this.retrieveConnectionWithNode(ip, port)
    }

    const clusterPacket = { deliverPacket }
    recipientClusterNodeConnection.send(JSON.stringify(clusterPacket))
  }

  async cleanDestroyedNodeData(nodeEndpoint) {
    logger.debug("[clean node] %s", nodeEndpoint)

    delete this.clusterNodesConnections[nodeEndpoint]

    const sessionService = ServiceLocatorContainer.use("SessionService")

    const lastUserSessions = await sessionService.clearNodeUsersSession(nodeEndpoint)
      .catch(error => logger.error(error, "[clean node]"))

    if (!lastUserSessions) {
      return
    }

    const offlineUserResponses = lastUserSessions.map(userSession => activitySender.buildOfflineActivityResponse(userSession.organizationId, userSession.userId))

    for (const offlineUserResponse of offlineUserResponses) {
      await this.processAPIResponse(void 0, offlineUserResponse)
    }
  }
}

export default new ClusterManager(void 0, void 0)
