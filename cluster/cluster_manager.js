import WebSocket from "ws";
import ip from "ip";
import { StringDecoder } from "string_decoder";
import { buildWsEndpoint } from "../utils/build_ws_enpdoint.js";
import { default as PacketProcessor } from "../routes/delivery_manager.js";
import { getIpFromWsUrl } from "../utils/get_ip_from_ws_url.js";
const decoder = new StringDecoder("utf8");

const clusterNodesWS = {};

async function shareCurrentNodeInfo(ws) {
  ws.send(
    JSON.stringify({
      node_info: {
        ip: ip.address(),
      },
    })
  );
}

async function createToNodeSocket(ip, port) {
  if (clusterNodesWS[ip]) {
    return;
  }

  const url = buildWsEndpoint(ip, port);
  if (!url) {
    throw "Can't create To Node Socket w/o url";
  }

  const ws = new WebSocket(url);

  ws.on("error", async () => {
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
}

function clusterRoutes(app, wsOptions) {
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

export { clusterRoutes, clusterNodesWS, createToNodeSocket };
