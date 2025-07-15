import net from "net"
import tls from "tls"
import uWS from "uWebSockets.js"
import { StringDecoder } from "string_decoder"

import { ERROR_STATUES } from "../constants/errors.js"
import { CONSTANTS as MAIN_CONSTANTS } from "../constants/constants.js"

import { BASE_API, APIs, detectAPIType } from "./APIs.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import packetManager from "./packet_manager.js"
import packetMapper from "./packet_mapper.js"
import HttpServerApp from "./http_server.js"
import sendMultiplePackages from "../utils/send-multiple-socket-packages.js"

import activitySender from "../services/activity_sender.js"

import MappableMessage from "./models/MappableMessage.js"

const decoder = new StringDecoder("utf8")

const mapBackMessageFunc = async (ws, packet) => packetMapper.mapPacket(null, ws.apiType, packet, {}, {})

const onMessage = async (ws, message) => {
  const stringMessage = decoder.write(Buffer.from(message))?.trim()
  console.log("[RECV]", stringMessage, stringMessage.length)

  if (!stringMessage.length) {
    return
  }

  if (!ws.apiType) {
    const apiType = detectAPIType(ws, stringMessage)
    if (!apiType) {
      throw new Error("Unknown message format")
    }
    ws.apiType = apiType.at(0)
  }

  const api = APIs[ws.apiType]

  const splittedMessages = api.splitPacket(stringMessage)

  console.log("[RECV][splitted]", splittedMessages)

  for (const splittedMessage of splittedMessages) {
    const response = await api.onMessage(ws, splittedMessage)

    await processMessageResponse(ws, response)
  }
}

const processMessageResponse = async (ws, response, needStringify) => {
  if (needStringify) {
    response = APIs[BASE_API].stringifyResponse(response)
  }

  if (response.lastActivityStatusResponse) {
    const sessionService = ServiceLocatorContainer.use("SessionService")

    const userId = response.lastActivityStatusResponse.userId || sessionService.getSessionUserId(ws)
    console.log("[UPDATE_LAST_ACTIVITY]", userId, response.lastActivityStatusResponse)
    const responses = await activitySender.updateAndBuildUserActivity(ws, userId, response.lastActivityStatusResponse.status)
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
    console.log("[DELIVER]", deliverMessage)

    deliverMessage.ws ??= ws

    if (deliverMessage.userIds?.length) {
      await processDeliverUserMessage(deliverMessage)
    } else if (deliverMessage.cId) {
      await processDeliverConversationMessage(deliverMessage)
    }
  }

  if (response.closeSocket) {
    ws.end()
  }

  if (response.upgradeTls) {
    ws.emit("upgrade")
  }
}

const processDeliverUserMessage = async (deliverMessage, participantIds) => {
  try {
    await packetManager.deliverToUserOrUsers(
      deliverMessage.ws,
      deliverMessage.packet,
      deliverMessage.pushQueueMessage,
      participantIds ?? deliverMessage.userIds,
      deliverMessage.notSaveInOfflineStorage,
      deliverMessage.ignoreSelf
    )
  } catch (e) {
    console.error("[ClientManager] connection with client socket is lost", e)
  }
}

const processDeliverConversationMessage = async (deliverMessage) => {
  const { cId, exceptUserIds } = deliverMessage

  const conversationService = ServiceLocatorContainer.use("ConversationService")

  for await (const participantIds of conversationService.conversationParticipantIdsIterator(cId, exceptUserIds)) {
    if (!participantIds.length) {
      continue
    }

    await processDeliverUserMessage(deliverMessage, participantIds)
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

const onClose = async (ws) => {
  const sessionService = ServiceLocatorContainer.use("SessionService")

  const userId = sessionService.getSessionUserId(ws)

  console.log("[ClientManager] ws on Close", userId)

  if (!userId) {
    return
  }

  await sessionService.removeUserSession(ws, userId)

  await processMessageResponse(ws, activitySender.buildOfflineActivityResponse(userId), true)
}

class ClientManager {
  #localTCPSocket = null
  #localWebSocket = null
  #httpServerApp = null

  createWebSocket(uwsOptions) {
    return new Promise((resolve) => {
      this.#localWebSocket = uwsOptions.isSSL ? uWS.SSLApp(uwsOptions.appOptions) : uWS.App(uwsOptions.appOptions)

      this.#localWebSocket.ws("/*", {
        ...uwsOptions.wsOptions,

        open: (ws) => {
          console.log("[ClientManager][WS] on Open", `IP: ${Buffer.from(ws.getRemoteAddressAsText()).toString()}`)
        },

        close: async (ws, code, message) => {
          await onClose(ws)
        },

        message: async (ws, message, isBinary) => {
          try {
            await onMessage(ws, message)
          } catch (err) {
            console.log("[ClientManager][WS] onMessage error", err)
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

      this.#localWebSocket.listen(uwsOptions.port, uwsOptions.listenOptions, (listenSocket) => {
        if (!listenSocket) {
          throw new Error(`[ClientManager][WS] can't allocate port`)
        }

        console.log(`[ClientManager][WS] listening on port ${uWS.us_socket_local_port(listenSocket)}, pid=${process.pid}`)

        return resolve(uwsOptions.port)
      })
    })
  }

  createHttpServer(httpOptions) {
    this.#httpServerApp = new HttpServerApp(this.#localWebSocket)
    this.#httpServerApp.setResponseProcessor(processMessageResponse)
    this.#httpServerApp.setUnbindSessionCallback(unbindSessionCallback)
    this.#httpServerApp.bindRoutes()

    console.log(`[ClientManager][HTTP] listening on [WS] port, pid=${process.pid}`)
  }

  createTCPSocket(tcpOptions) {
    return new Promise((resolve) => {
      const tcpOnData = async function (message) {
        try {
          await onMessage(this, message)
        } catch (err) {
          console.log("[ClientManager][TCP] onMessage error", err)
          this.send(
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
      }

      const tcpOnClose = async function () {
        await onClose(this)
      }

      const tcpOnError = function (err) {
        console.log("[ClientManager][TCP] socket error", err)
      }

      const socketListeners = (socket, isTls) => {
        socket.send = (message) => {
          socket.write(message)
        }

        socket.sendMultiple = (messages) => sendMultiplePackages(socket, messages)

        socket.on("data", tcpOnData)

        socket.on("close", tcpOnClose)

        socket.on("error", tcpOnError)

        if (!isTls) {
          socket.once("upgrade", () => {
            console.log("[Upgrade]")

            removeSocketListeners(socket)

            const options = {
              isServer: true,
              key: tcpOptions.key,
              cert: tcpOptions.cert,
            }

            console.log("[Upgrade][options]", options)

            const tlsSocket = new tls.TLSSocket(socket, options)

            tlsSocket.on("secureConnect", () => {
              console.log("TLS handshake complete")
            })

            tlsSocket.on("data", (message) => {
              const stringMessage = decoder.write(Buffer.from(message))
              console.log("[RECV][TLS]", stringMessage)
            })

            socketListeners(tlsSocket, true)
          })
        }
      }

      const removeSocketListeners = (socket) => {
        socket.send = void 0
        socket.sendMultiple = void 0

        socket.removeListener("data", tcpOnData)
        socket.removeListener("close", tcpOnClose)
        socket.removeListener("error", tcpOnError)
      }

      this.#localTCPSocket = net.createServer((socket) => {
        console.log("[ClientManager][TCP] on Open", `IP: ${socket.remoteAddress}`)

        socketListeners(socket)
      })

      this.#localTCPSocket.listen(tcpOptions.port, () => {
        console.log(`[ClientManager][TCP] listening on port ${tcpOptions.port}, pid=${process.pid}`)

        return resolve(tcpOptions.port)
      })
    })
  }
}

export default new ClientManager()
