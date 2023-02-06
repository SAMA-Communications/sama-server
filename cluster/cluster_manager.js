import WebSocket from "ws";
import ip from "ip";
import { StringDecoder } from "string_decoder";
const decoder = new StringDecoder("utf8");

const clusterClientsWS = {};
const clusterNodesWS = {};

async function createTransitionSocket(url) {
  if (clusterNodesWS[url] || !url) {
    return;
  }

  const ws = new WebSocket(url);

  ws.on("open", () => {
    console.log("[SubSocket] Open", `url ${ws.url}`);
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
    const json = JSON.parse(decoder.write(Buffer.from(data)));
    console.log("[SubSocket.message]", json);

    if (json.node) {
      const nodeInfo = json.node;
      clusterNodesWS[nodeInfo.ip] = { ws, hostname: nodeInfo.hostname };
      return;
    }
  });

  clusterNodesWS[url] = { connect: "success" };
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

      clusterClientsWS?.ws.send(JSON.stringify(json));
    },
  });
}

export { clusterClientsWS, clusterNodesWS, createTransitionSocket };
