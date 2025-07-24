import WebSocket from "ws"
import uWS from "uWebSockets.js"
import { StringDecoder } from "string_decoder"

import config from "../config/index.js"
import logger from "../logger/index.js"

import packetManager from "../networking/packet_manager.js"

import { buildWsEndpoint } from "../utils/build_ws_endpoint.js"
import { getIpFromWsUrl } from "../utils/get_ip_from_ws_url.js"

const decoder = new StringDecoder("utf8")

class ClusterManager {
  #clusterNodesWS = {}

  #localSocket = null

  get clusterNodesWS() {
    return this.#clusterNodesWS
  }

  #shareCurrentNodeInfo(ws) {
    ws.send(
      JSON.stringify({
        node_info: {
          ip: config.get("app.ip"),
        },
      })
    )
  }

  async senderClusterDeliverPacket(nodeUrl, deliverPacket) {
    const ip = getIpFromWsUrl(nodeUrl)
    const port = nodeUrl.split(":").at(2)

    let recipientClusterNodeWS = this.clusterNodesWS[getIpFromWsUrl(nodeUrl)]

    if (!recipientClusterNodeWS) {
      recipientClusterNodeWS = await this.createSocketWithNode(ip, port)
    }

    const clusterPacket = { deliverPacket }
    recipientClusterNodeWS.send(JSON.stringify(clusterPacket))
  }

  async createSocketWithNode(ip, port) {
    return new Promise((resolve, reject) => {
      const existingWS = this.clusterNodesWS[ip]
      if (existingWS) {
        resolve(existingWS)
        return
      }

      const url = buildWsEndpoint(ip, port)
      if (!url) {
        reject(`[ClusterManager][createSocketWithNode] can't create To Node Socket w/o url`)
        return
      }

      const ws = new WebSocket(url)

      ws.on("error", async (event) => {
        console.error("[ClusterManager][createSocketWithNode] ws on Error", event)
        reject("[ClusterManager][createSocketWithNode] ws on error")
      })

      ws.on("open", async () => {
        logger.debug("[ClusterManager][createSocketWithNode] ws on Open url %s", ws.url)
        this.#shareCurrentNodeInfo(ws)
      })

      ws.on("message", async (data) => {
        const json = JSON.parse(decoder.write(Buffer.from(data)))

        logger.debug("[ClusterManager] ws on Message %j", json)

        if (json.node_info) {
          const nodeInfo = json.node_info
          this.clusterNodesWS[nodeInfo.ip] = ws
          resolve(ws)
          return
        }

        await packetManager.deliverClusterMessageToUser(json.deliverPacket)
      })

      ws.on("close", async () => {
        logger.debug("[ClusterManager][createSocketWithNode] ws on Close %s", ws.url)
        delete this.clusterNodesWS[getIpFromWsUrl(ws.url)]
      })
    })
  }

  async createLocalSocket({ isSSL, appOptions, wsOptions, listenOptions }) {
    return new Promise((resolve) => {
      this.#localSocket = isSSL ? uWS.SSLApp(appOptions) : uWS.App(appOptions)

      this.#localSocket.ws("/*", {
        ...wsOptions,

        open: (ws) => {
          logger.debug("[ClusterManager][WS] on Open IP: %s", Buffer.from(ws.getRemoteAddressAsText()).toString())
        },

        close: async (ws, code, message) => {
          logger.debug("[ClusterManager][WS] on Close")
          for (const nodeIp in this.clusterNodesWS) {
            if (this.clusterNodesWS[nodeIp] !== ws) {
              continue
            }

            delete this.clusterNodesWS[nodeIp]
            return
          }
        },

        message: async (ws, message, isBinary) => {
          const json = JSON.parse(decoder.write(Buffer.from(message)))

          logger.debug("[ClusterManager][WS] on Message %j", json)

          if (json.node_info) {
            const nodeInfo = json.node_info
            this.clusterNodesWS[nodeInfo.ip] = ws
            this.#shareCurrentNodeInfo(ws)

            return
          }

          await packetManager.deliverClusterMessageToUser(json.deliverPacket)
        },
      })

      this.#localSocket.listen(0, listenOptions, (listenSocket) => {
        if (!listenSocket) {
          throw new Error(`[ClusterManager][WS] socket.listen error: can't allocate port`)
        }

        const clusterPort = uWS.us_socket_local_port(listenSocket)
        logger.debug("[ClusterManager][WS] listening on port %s", clusterPort)

        return resolve(clusterPort)
      })
    })
  }
}

export default new ClusterManager()
