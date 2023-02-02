export const clusterNodesWS = {};

export default function clusterRoutes(app, wsOptions) {
  app.ws("/*", {
    ...wsOptions,

    open: (ws) => {
      console.log(
        "[ClusterWS][open]",
        `IP: ${Buffer.from(ws.getRemoteAddressAsText()).toString()}`
      );
      clusterNodesWS[Buffer.from(ws.getRemoteAddressAsText()).toString()] = ws;
    },

    close: async (ws, code, message) => {
      console.log("[close]", `WebSokect connect down`);
      // delete clusterNodesWS[
      //   Buffer.from(ws.getRemoteAddressAsText()).toString()
      // ];
    },

    message: async (ws, message, isBinary) => {
      const json = JSON.parse(decoder.write(Buffer.from(message)));

      const responseData = await processJsonMessageOrError(ws, json);
      ws.send(JSON.stringify(responseData));
    },
  });
}
