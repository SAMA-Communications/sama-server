import ip from "ip";
import { ACTIVE } from "../store/session.js";
import { StringDecoder } from "string_decoder";
import { default as PacketProcessor } from "./delivery_manager.js";
import { default as SessionRepository } from "../repositories/session_repository.js";
import { maybeUpdateAndSendUserActivity } from "../store/activity.js";
const decoder = new StringDecoder("utf8");

export default function routes(app, wsOptions) {
  app.ws("/*", {
    ...wsOptions,

    open: (ws) => {
      console.log(
        "[open]",
        `IP: ${Buffer.from(ws.getRemoteAddressAsText()).toString()}`
      );
    },

    close: async (ws, code, message) => {
      console.log("[close]", `WebSokect connect down`);
      const uId = SessionRepository.getSessionUserId(ws);
      const arrDevices = ACTIVE.DEVICES[uId];

      if (arrDevices) {
        ACTIVE.DEVICES[uId] = arrDevices.filter((obj) => {
          if (obj.ws === ws) {
            SessionRepository.removeUserNodeData(
              uId,
              obj.deviceId,
              ip.address(),
              process.env.CLUSTER_COMMUNICATION_PORT
            );
            return false;
          }
          return true;
        });
        await maybeUpdateAndSendUserActivity(ws, { uId });
      }
      ACTIVE.SESSIONS.delete(ws);
    },

    message: async (ws, message, isBinary) => {
      const json = JSON.parse(decoder.write(Buffer.from(message)));

      const responseData = await PacketProcessor.processJsonMessageOrError(
        ws,
        json
      );

      responseData && ws.send(JSON.stringify(responseData));
    },
  });
}
