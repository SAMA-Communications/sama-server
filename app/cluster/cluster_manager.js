import WebSocket from "ws"
import uWS from "uWebSockets.js"
import ip from "ip"
import { StringDecoder } from "string_decoder"

import { buildWsEndpoint } from "../utils/build_ws_endpoint.js"
import { default as PacketManager } from "../networking/packet_manager.js"
import { getIpFromWsUrl } from "../utils/get_ip_from_ws_url.js"

const decoder = new StringDecoder("utf8")

class ClusterManager {
  #clusterPort = -1;
  #clusterNodesWS = {};

  #localSocket = null;

  set clusterPort(port) {
    this.#clusterPort = port;
  }

  get clusterPort() {
    return this.#clusterPort;
  }

  get clusterNodesWS() {
    return this.#clusterNodesWS;
  }

  #shareCurrentNodeInfo(ws) {
    ws.send(
      JSON.stringify({
        node_info: {
          ip: ip.address(),
        },
      })
    );
  }

  async createSocketWithNode(ip, port) {
    return new Promise((resolve, reject) => {
      const existingWS = this.clusterNodesWS[ip];
      if (existingWS) {
        resolve(existingWS);
        return;
      }

      const url = buildWsEndpoint(ip, port);
      if (!url) {
        reject(
          "[ClusterManager][createSocketWithNode] can't create To Node Socket w/o url"
        );
        return;
      }

      const ws = new WebSocket(url);

      ws.on("error", async (event) => {
        console.error(
          "[ClusterManager][createSocketWithNode] ws on Error",
          event
        );
        reject("[ClusterManager][createSocketWithNode] ws on error");
      });

      ws.on("open", async () => {
        console.log(
          "[ClusterManager][createSocketWithNode] ws on Open",
          `url ${ws.url}`
        );
        this.#shareCurrentNodeInfo(ws);
      });

      ws.on("message", async (data) => {
        const json = JSON.parse(decoder.write(Buffer.from(data)));
        console.log("[ClusterManager] ws on Message", json);

        if (json.node_info) {
          const nodeInfo = json.node_info;
          this.clusterNodesWS[nodeInfo.ip] = ws;
          resolve(ws);
          return;
        }

        await PacketManager.deliverClusterMessageToUser(
          json.userId,
          json.message
        );
      });

      ws.on("close", async () => {
        console.log(
          "[ClusterManager][createSocketWithNode] ws on Close",
          ws.url
        );
        delete this.clusterNodesWS[getIpFromWsUrl(ws.url)];
      });
    });
  }

  async createLocalSocket(appOptions, wsOptions, listenOptions, isSSL) {
    if (isSSL) {
      this.#localSocket = uWS.SSLApp(appOptions);
    } else {
      this.#localSocket = uWS.App(appOptions);
    }

    this.#localSocket.ws("/*", {
      ...wsOptions,

      open: (ws) => {
        console.log(
          "[ClusterManager][createLocalSocket] ws on Open",
          `IP: ${Buffer.from(ws.getRemoteAddressAsText()).toString()}`
        );
      },

      close: async (ws, code, message) => {
        console.log("[ClusterManager][createLocalSocket] ws on Close");
        for (const nodeIp in this.clusterNodesWS) {
          if (this.clusterNodesWS[nodeIp] !== ws) {
            continue;
          }

          delete this.clusterNodesWS[nodeIp];
          return;
        }
      },

      message: async (ws, message, isBinary) => {
        const json = JSON.parse(decoder.write(Buffer.from(message)));
        if (json.node_info) {
          const nodeInfo = json.node_info;
          this.clusterNodesWS[nodeInfo.ip] = ws;
          this.#shareCurrentNodeInfo(ws);

          return;
        }

        await PacketManager.deliverClusterMessageToUser(
          json.userId,
          json.message
        );
      },
    });

    this.#localSocket.listen(0, listenOptions, (listenSocket) => {
      if (listenSocket) {
        const clusterPort = uWS.us_socket_local_port(listenSocket);
        console.log(
          `[ClusterManager][createLocalSocket] listening on port ${clusterPort}`
        );
        this.clusterPort = clusterPort;
      } else {
        throw "[ClusterManager][createLocalSocket] socket.listen error: can't allocate port";
      }
    });
  }
}

export default new ClusterManager();
