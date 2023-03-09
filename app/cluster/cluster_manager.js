import WebSocket from "ws";
import ip from "ip";
import { StringDecoder } from "string_decoder";
import { buildWsEndpoint } from "../utils/build_ws_enpdoint.js";
import { default as PacketProcessor } from "../routes/delivery_manager.js";
import { getIpFromWsUrl } from "../utils/get_ip_from_ws_url.js";
const decoder = new StringDecoder("utf8");

export const clusterNodesWS = {};

let clusterPort;

export function setClusterPort(port) {
  clusterPort = port;
}

export function getClusterPort() {
  return clusterPort;
}

async function shareCurrentNodeInfo(ws) {
  ws.send(
    JSON.stringify({
      node_info: {
        ip: ip.address(),
      },
    })
  );
}

export async function createToNodeSocket(ip, port) {
  return new Promise((resolve, reject) => {
    if (clusterNodesWS[ip]) {
      resolve();
      return;
    }

    const url = buildWsEndpoint(ip, port);
    if (!url) {
      reject("Can't create To Node Socket w/o url");
      return;
    }

    const ws = new WebSocket(url);

    ws.on("error", async () => {
      reject("Error while setuping socket");
      console.error("[SubSocket.error] Socket offline");
    });

    ws.on("open", async () => {
      console.log("[SubSocket] Open", `url ${ws.url}`);
      await shareCurrentNodeInfo(ws);
    });

    ws.on("message", async (data) => {
      const json = JSON.parse(decoder.write(Buffer.from(data)));
      console.log("[SubSocket.message]", json);

      if (json.node_info) {
        const nodeInfo = json.node_info;
        clusterNodesWS[nodeInfo.ip] = ws;
        resolve(ws);
        return;
      }

      await PacketProcessor.deliverClusterMessageToUser(
        json.userId,
        json.message
      );
    });

    ws.on("close", async () => {
      console.log("[SubSocket] Close connect", ws.url);
      delete clusterNodesWS[getIpFromWsUrl(ws.url)];
    });
  });
}

export function clusterRoutes(app, wsOptions) {
  app.ws("/*", {
    ...wsOptions,

    open: (ws) => {
      console.log(
        "[ClusterWS][open]",
        `IP: ${Buffer.from(ws.getRemoteAddressAsText()).toString()}`
      );
    },

    close: async (ws, code, message) => {
      console.log("[close] WebSokect connect down");
      for (const nodeIp in clusterNodesWS) {
        if (clusterNodesWS[nodeIp] !== ws) {
          continue;
        }

        delete clusterNodesWS[nodeIp];
        return;
      }
    },

    message: async (ws, message, isBinary) => {
      const json = JSON.parse(decoder.write(Buffer.from(message)));
      if (json.node_info) {
        const nodeInfo = json.node_info;
        clusterNodesWS[nodeInfo.ip] = ws;
        await shareCurrentNodeInfo(ws);

        return;
      }

      await PacketProcessor.deliverClusterMessageToUser(
        json.userId,
        json.message
      );
    },
  });
}
