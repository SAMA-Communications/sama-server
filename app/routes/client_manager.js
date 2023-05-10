import SessionRepository from "../repositories/session_repository.js";
import clusterManager from "../cluster/cluster_manager.js";
import ip from "ip";
import uWS from "uWebSockets.js";
import { ACTIVE } from "../store/session.js";
import { StringDecoder } from "string_decoder";
import { default as PacketProcessor } from "./packet_processor.js";
const decoder = new StringDecoder("utf8");
const sessionRepository = new SessionRepository(ACTIVE);

class ClientManager {
  #localSocket = null;

  async createLocalSocket(appOptions, wsOptions, listenOptions, isSSL, port) {
    if (isSSL) {
      this.#localSocket = uWS.SSLApp(appOptions);
    } else {
      this.#localSocket = uWS.App(appOptions);
    }

    this.#localSocket.ws("/*", {
      ...wsOptions,

      open: (ws) => {
        console.log(
          "[ClientManager] ws on Open",
          `IP: ${Buffer.from(ws.getRemoteAddressAsText()).toString()}`
        );
      },

      close: async (ws, code, message) => {
        console.log("[ClientManager] ws on Close");

        const uId = sessionRepository.getSessionUserId(ws);
        const arrDevices = ACTIVE.DEVICES[uId];

        if (arrDevices) {
          ACTIVE.DEVICES[uId] = arrDevices.filter((obj) => {
            if (obj.ws === ws) {
              sessionRepository.removeUserNodeData(
                uId,
                obj.deviceId,
                ip.address(),
                clusterManager.clusterPort
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

        let consoleMessage = JSON.parse(decoder.write(Buffer.from(message)));
        consoleMessage?.request?.user_login.password &&
          (consoleMessage.request.user_login.password = "********");
        console.log(
          `[ClientManager] ws on message (pid=${process.pid})`,
          consoleMessage
        );

        const responseData = await PacketProcessor.processJsonMessageOrError(
          ws,
          json
        );

        if (responseData) {
          try {
            ws.send(JSON.stringify(responseData));
          } catch (e) {
            console.error("[ClientManager] connection with client ws is lost");
          }
        }
      },
    });

    this.#localSocket.listen(port, listenOptions, (listenSocket) => {
      if (listenSocket) {
        console.log(
          `    [ClientManager][createLocalSocket] listening on port ${uWS.us_socket_local_port(
            listenSocket
          )}, pid=${process.pid}`
        );
      } else {
        throw "[ClientManager][createLocalSocket] socket.listen error: can't allocate port";
      }
    });
  }
}

export default new ClientManager();
