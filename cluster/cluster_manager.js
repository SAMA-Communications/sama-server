import WebSocket from "ws";
import ip from "ip";
import { StringDecoder } from "string_decoder";
import { saveRequestInOfflineQueue } from "../store/offline_queue.js";
const decoder = new StringDecoder("utf8");

const clusterNodesWS = {};

async function shareCurrentNodeInfo(ws) {
  ws.send(
    JSON.stringify({
      node_info: {
        //TODO: replace this line
        // hostname: process.env.DEVICE_HOSTNAME,
        hostname: process.env.REDIS_HOSTNAME,
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
  if (clusterNodesWS[url] || !url) {
    return;
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
      clusterNodesWS[nodeInfo.ip] = { ws, hostname: nodeInfo.hostname };
      return;
    }

    //TODO: function deliverTo... || similar 1
    const { userId, message: request } = json;
    await deliverMessageToUser(userId, request);
  });

  clusterNodesWS[url] = { connect: "success" };
}

function clusterRoutes(app, wsOptions) {
  app.ws("/*", {
    ...wsOptions,

    open: (ws) => {
      console.log(
        "[ClusterWS][open]",
        `IP: ${Buffer.from(ws.getRemoteAddressAsText()).toString()}`
      );
      console.log("ws: ", ws);
      console.log(
        "getRemoteAddressAsText: ",
        Buffer.from(ws.getRemoteAddressAsText()).toString()
      );
      console.log(
        "getRemoteAddress: ",
        Buffer.from(ws.getRemoteAddress()).toString()
      );
    },

    close: async (ws, code, message) => {
      console.log("[close]", `WebSokect connect down`);
    },

    message: async (ws, message, isBinary) => {
      const json = JSON.parse(decoder.write(Buffer.from(message)));
      if (json.node_info) {
        const nodeInfo = json.node_info;
        clusterNodesWS[nodeInfo.ip] = { ws, hostname: nodeInfo.hostname };
        await shareCurrentNodeInfo(ws);

        return;
      }

      //TODO: function deliverTo... || similar 1
      const { userId, message: request } = json;
      await deliverMessageToUser(userId, request);
    },
  });
}

export { clusterRoutes, clusterNodesWS, createToNodeSocket };
