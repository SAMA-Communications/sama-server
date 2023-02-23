import SessionRepository from "../repositories/session_repository.js";
import ip from "ip";
import { ACTIVE } from "../store/session.js";
import { StringDecoder } from "string_decoder";
import { default as PacketProcessor } from "./delivery_manager.js";
import { getClusterPort } from "../cluster/cluster_manager.js";
const decoder = new StringDecoder("utf8");
const sessionRepository = new SessionRepository(ACTIVE);

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
      const uId = sessionRepository.getSessionUserId(ws);
      const arrDevices = ACTIVE.DEVICES[uId];

      if (arrDevices) {
        ACTIVE.DEVICES[uId] = arrDevices.filter((obj) => {
          if (obj.ws === ws) {
            sessionRepository.removeUserNodeData(
              uId,
              obj.deviceId,
              ip.address(),
              getClusterPort()
            );
            return false;
          }
          return true;
        });
        await PacketProcessor.maybeUpdateAndSendUserActivity(ws, { uId });
      }
      ACTIVE.SESSIONS.delete(ws);
    },

    message: async (ws, message, isBinary) => {
      const json = JSON.parse(decoder.write(Buffer.from(message)));

      console.log(`[message](pid=${process.pid})`, json);

      const responseData = await PacketProcessor.processJsonMessageOrError(
        ws,
        json
      );

      responseData && ws.send(JSON.stringify(responseData));
    },
  });
}
