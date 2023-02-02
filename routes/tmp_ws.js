import WebSocket from "ws";

export const transitionWS = {};

export async function createTransitionSocket(url) {
  if (transitionWS[url] || !url) {
    return;
  }

  const ws = new WebSocket(url);

  ws.on("open", () => {
    console.log("[SubSocket] Open");
  });

  ws.on("message", (data) => {
    console.log("received: %s", data);
    //send to main ws
  });

  transitionWS[url] = ws;
  console.log("[SubSocket] Create connect with", url);
}
