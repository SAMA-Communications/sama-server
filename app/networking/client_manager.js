import uWS from "uWebSockets.js"
import { StringDecoder } from "string_decoder"

import { ERROR_STATUES } from "../constants/errors.js"
import { CONSTANTS as MAIN_CONSTANTS } from "../constants/constants.js"

import { BASE_API, APIs, detectAPIType } from "./APIs.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import packetManager from "./packet_manager.js"
import packetMapper from "./packet_mapper.js"
import HttpServerApp from "./http_server.js"

import activitySender from "../services/activity_sender.js"

import MappableMessage from "./models/MappableMessage.js"

const decoder = new StringDecoder("utf8")

const mapBackMessageFunc = async (ws, packet) => packetMapper.mapPacket(null, ws.apiType, packet, {}, {})

const onMessage = async (ws, message) => {
  const stringMessage = decoder.write(Buffer.from(message))
  console.log("[RECV]", stringMessage)

  if (!ws.apiType) {
    const apiType = detectAPIType(ws, stringMessage)
    if (!apiType) {
      throw new Error("Unknown message format")
    }
    ws.apiType = apiType.at(0)
  }

  const api = APIs[ws.apiType]
  const response = await api.onMessage(ws, stringMessage)

  await processMessageResponse(ws, response)
}

const processMessageResponse = async (ws, response, needStringify) => {
  if (needStringify) {
    response = APIs[BASE_API].stringifyResponse(response)
  }

  if (response.lastActivityStatusResponse) {
    const sessionService = ServiceLocatorContainer.use("SessionService")

    const userId = response.lastActivityStatusResponse.userId || sessionService.getSessionUserId(ws)
    console.log("[UPDATE_LAST_ACTIVITY]", userId, response.lastActivityStatusResponse)
    const responses = await activitySender.updateAndBuildUserActivity(
      ws,
      userId,
      response.lastActivityStatusResponse.status
    )
    responses.forEach((activityResponse) => response.merge(activityResponse))
  }

  for (let backMessage of response.backMessages) {
    try {
      if (backMessage instanceof MappableMessage) {
        backMessage = await backMessage.mapMessage(mapBackMessageFunc.bind(ws))
      }
      console.log("[SENT]", backMessage)
      ws.send(backMessage)
    } catch (e) {
      console.error("[ClientManager] connection with client ws is lost", e)
    }
  }

  for (const deliverMessage of response.deliverMessages) {
    try {
      console.log("[DELIVER]", deliverMessage)
      await packetManager.deliverToUserOrUsers(
        deliverMessage.ws || ws,
        deliverMessage.packet,
        deliverMessage.pushQueueMessage,
        deliverMessage.userIds,
        deliverMessage.notSaveInOfflineStorage
      )
    } catch (e) {
      console.error("[ClientManager] connection with client ws is lost", e)
    }
  }
}

const unbindSessionCallback = async (wsKey) => {
  const sessionService = ServiceLocatorContainer.use("SessionService")
  const session = sessionService.getSession(wsKey)
  if (!session?.userId) {
    return
  }
  await sessionService.removeUserSession(wsKey, session.userId, MAIN_CONSTANTS.HTTP_DEVICE_ID)
}

class ClientManager {
  #localSocket = null
  #httpServerApp = null

  async createLocalSocket(appOptions, wsOptions, listenOptions, isSSL, port) {
    return new Promise((resolve) => {
      this.#localSocket = isSSL ? uWS.SSLApp(appOptions) : uWS.App(appOptions)

      this.#localSocket.ws("/*", {
        ...wsOptions,

        open: (ws) => {
          console.log("[ClientManager] ws on Open", `IP: ${Buffer.from(ws.getRemoteAddressAsText()).toString()}`)
        },

        close: async (ws, code, message) => {
          const sessionService = ServiceLocatorContainer.use("SessionService")

          const userId = sessionService.getSessionUserId(ws)

          if (!userId) {
            console.log("[ClientManager] ws on Close")
            return
          } else {
            console.log("[ClientManager] ws on Close", userId)
          }

          await sessionService.removeUserSession(ws, userId)

          await processMessageResponse(ws, activitySender.buildOfflineActivityResponse(userId), true)
        },

        message: async (ws, message, isBinary) => {
          try {
            await onMessage(ws, message)
          } catch (err) {
            console.log("[ClientManager] onMessage error", err)
            // const rawPacket = decoder.write(Buffer.from(message))
            // console.error('[ClientManager] ws on message error', err, rawPacket)
            ws.send(
              JSON.stringify({
                response: {
                  error: {
                    status: ERROR_STATUES.INVALID_DATA_FORMAT.status,
                    message: ERROR_STATUES.INVALID_DATA_FORMAT.message,
                  },
                },
              })
            )
          }
        },
      })

      this.#httpServerApp = new HttpServerApp(this.#localSocket)
      this.#httpServerApp.setResponseProcessor(processMessageResponse)
      this.#httpServerApp.setUnbindSessionCallback(unbindSessionCallback)
      this.#httpServerApp.bindRoutes()

      this.#localSocket.listen(port, listenOptions, (listenSocket) => {
        if (listenSocket) {
          console.log(
            `[ClientManager][createLocalSocket] listening on port ${uWS.us_socket_local_port(
              listenSocket
            )}, pid=${process.pid}`
          )

          return resolve(port)
        } else {
          throw new Error(`[ClientManager][createLocalSocket] socket.listen error: can't allocate port`)
        }
      })
    })
  }
}

export default new ClientManager()
