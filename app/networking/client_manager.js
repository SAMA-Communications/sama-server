import ip from "ip";
import uWS from "uWebSockets.js";
import { StringDecoder } from "string_decoder"

import SessionRepository from "../repositories/session_repository.js";
import clusterManager from "../cluster/cluster_manager.js"
import { ACTIVE } from "../store/session.js"
import { ERROR_STATUES } from "../constants/errors.js"
import activityManager from "./activity_manager.js"
import APIs from "./APIs.js"

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
          await activityManager.updateAndSendUserActivity(ws, { uId });
        }
        ACTIVE.SESSIONS.delete(ws);
      },

      message: async (ws, message, isBinary) => {
        try {
          const stringMessage = decoder.write(Buffer.from(message));
          if (!ws.apiType) {
            const apiType = Object.entries(APIs).find(([type, api]) => {
              try {
                return api.detectMessage(ws, stringMessage)
              } catch (error) {
                return false
              }
            })
            if (!apiType) {
              throw new Error('Unknown message format')
            }
            ws.apiType = apiType.at(0)
          }

          const api = APIs[ws.apiType]
          const responseData = await api.onMessage(ws, stringMessage);

          if (responseData) {
            try {
              ws.send(responseData);
            } catch (e) {
              console.error(
                "[ClientManager] connection with client ws is lost"
              );
            }
          }
        } catch (err) {
          const rawPacket = decoder.write(Buffer.from(message));
          console.error("[ClientManager] ws on message error", err, rawPacket);
          ws.send(
            JSON.stringify({
              response: {
                error: {
                  status: ERROR_STATUES.INVALID_DATA_FORMAT.status,
                  message: ERROR_STATUES.INVALID_DATA_FORMAT.message,
                },
              },
            })
          );
        }
      },
    });

    this.#localSocket.listen(port, listenOptions, (listenSocket) => {
      if (listenSocket) {
        console.log(
          `[ClientManager][createLocalSocket] listening on port ${uWS.us_socket_local_port(
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
