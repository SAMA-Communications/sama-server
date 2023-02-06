import WebSocket from "ws";
import ip from "ip";
import { StringDecoder } from "string_decoder";
const decoder = new StringDecoder("utf8");

const clusterClientsWs = {};
const clusterNodesWS = {};

async function createTransitionSocket(url) {
  if (clusterClientsWs[url] || !url) {
    return;
  }

  const ws = new WebSocket(url);

  ws.on("open", () => {
    console.log("[SubSocket] Open");
    //deliver info about this node to other node
    ws.send(
      JSON.stringify({
        node: {
          hostname: process.env.REDIS_HOSTNAME,
          ip: ip.address() + process.env.REDIS_HOSTNAME,
        },
      })
    );
  });

  ws.on("message", (data) => {
    console.log("received: %s", data);

    if (data.node) {
      const nodeInfo = json.node;
      clusterNodesWS[nodeInfo.ip] = { ws, hostname: nodeInfo.hostname };
      return;
    }
  });

  clusterClientsWs[url] = ws;
  console.log("[SubSocket] Create connect with", url);
}

export default function clusterRoutes(app, wsOptions) {
  app.ws("/*", {
    ...wsOptions,

    open: (ws) => {
      console.log(
        "[ClusterWS][open]",
        `IP: ${Buffer.from(ws.getRemoteAddressAsText()).toString()}`
      );
    },

    close: async (ws, code, message) => {
      console.log("[close]", `WebSokect connect down`);
      // delete clusterNodesWS[
      //   Buffer.from(ws.getRemoteAddressAsText()).toString()
      // ];
    },

    message: async (ws, message, isBinary) => {
      const json = JSON.parse(decoder.write(Buffer.from(message)));
      console.log(json);

      if (json.node) {
        const nodeInfo = json.node;
        clusterNodesWS[nodeInfo.ip] = { ws, hostname: nodeInfo.hostname };
        return;
      }

      const responseData = await processJsonMessageOrError(ws, json);
      ws.send(JSON.stringify(responseData));
    },
  });
}

export { clusterClientsWs, clusterNodesWS, createTransitionSocket };
