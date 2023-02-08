import WebSocket from "ws";
import ip from "ip";
import { StringDecoder } from "string_decoder";
import { saveRequestInOfflineQueue } from "../store/offline_queue.js";
import { deliverToUserOnThisNode } from "../routes/ws.js";
const decoder = new StringDecoder("utf8");

const clusterNodesWS = {};

async function shareCurrentNodeInfo(ws) {
  ws.send(
    JSON.stringify({
      node_info: {
        //TODO: remove "process.env.REDIS_HOSTNAME"
        ip: ip.address() + process.env.REDIS_HOSTNAME,
      },
    })
  );
}

async function deliverMessageToUser(userId, request) {
  try {
    deliverToUserOnThisNode(userId, request, null);
  } catch (err) {
    console.log(err);
    saveRequestInOfflineQueue(userId, request);
  }
}

async function createToNodeSocket(url) {
  if (clusterNodesWS[url.split(":")[1].slice(2)]) {
    return;
  }

  if (!url) {
    throw "Can't create To Node Socket w/o url";
  }

  const ws = new WebSocket(url);

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

    await deliverMessageToUser(json.userId, json.message);
  });

  ws.on("close", async () => {
    console.log("[SubSocket] Close connect", ws.url);
    delete clusterNodesWS[clusterNodesWS[ws.url.split(":")[1].slice(2)]];
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

      await deliverMessageToUser(json.userId, json.message);
    },
  });
}

export { clusterRoutes, clusterNodesWS, createToNodeSocket };
