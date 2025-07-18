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
import { tcpSafeSend, wsSafeSend, socketMultipleSafeSend } from "../utils/sockets-utils.js"

import activitySender from "../services/activity_sender.js"

import MappableMessage from "./models/MappableMessage.js"

const decoder = new StringDecoder("utf8")

const mapBackMessageFunc = async (ws, packet) => packetMapper.mapPacket(null, ws.apiType, packet, {}, {})

const onMessage = async (socket, stringMessage) => {
  if (!stringMessage) {
    return
  }

  if (!socket.apiType) {
    const apiType = detectAPIType(socket, stringMessage)
    if (!apiType) {
      throw new Error("Unknown message format")
    }
    socket.apiType = apiType.at(0)
  }

  const api = APIs[socket.apiType]

  const response = await api.onMessage(socket, stringMessage)

  await processMessageResponse(socket, response)
}

const processMessageResponse = async (socket, response, needStringify) => {
  if (needStringify) {
    response = APIs[BASE_API].stringifyResponse(response)
  }

  if (response.lastActivityStatusResponse) {
    const sessionService = ServiceLocatorContainer.use("SessionService")

    const userId = response.lastActivityStatusResponse.userId || sessionService.getSessionUserId(socket)
    console.log("[UPDATE_LAST_ACTIVITY]", userId, response.lastActivityStatusResponse)
    const responses = await activitySender.updateAndBuildUserActivity(socket, userId, response.lastActivityStatusResponse.status)
    responses.forEach((activityResponse) => response.merge(activityResponse))
  }

  for (let backMessage of response.backMessages) {
    try {
      if (backMessage instanceof MappableMessage) {
        backMessage = await backMessage.mapMessage(mapBackMessageFunc.bind(socket))
      }
      console.log("[SENT]", backMessage)
      await socket.safeSend(backMessage)
    } catch (e) {
      console.error("[ClientManager] connection with client ws is lost", e)
    }
  }

  for (const deliverMessage of response.deliverMessages) {
    console.log("[DELIVER]", deliverMessage)

    deliverMessage.ws ??= socket

    if (deliverMessage.userIds?.length) {
      await processDeliverUserMessage(deliverMessage)
    } else if (deliverMessage.cId) {
      await processDeliverConversationMessage(deliverMessage)
    }
  }

  if (response.closeSocket) {
    socket.end()
  }

  if (response.upgradeTls) {
    socket.emit("upgrade")
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

const onClose = async (socket) => {
  const sessionService = ServiceLocatorContainer.use("SessionService")

  const userId = sessionService.getSessionUserId(socket)

  console.log("[ClientManager] ws on Close", userId)

  if (!userId) {
    return
  }

  await sessionService.removeUserSession(socket, userId)

  await processMessageResponse(socket, activitySender.buildOfflineActivityResponse(userId), true)
}

const socketOnErrorProcessingMessage = (socket, error, message) => {
  socket.safeSend(
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

class ClientManager {
  #localTCPSocket = null
  #localWebSocket = null
  #httpServerApp = null

  createWebSocket(uwsOptions) {
    const extendWs = (ws) => {
      ws.safeSend = wsSafeSend.bind(ws, ws)
      ws.multipleSafeSend = socketMultipleSafeSend.bind(ws, ws)
    }

    const removeWsExtends = (ws) => {
      ws.safeSend = void 0
      ws.multipleSafeSend = void 0
    }

    const decodeMessage = (message) => {
      const stringMessage = decoder.write(Buffer.from(message))?.trim()
      console.log("[RECV]", stringMessage, stringMessage.length)
    
      if (!stringMessage.length) {
        return
      }

      return stringMessage
    }

    return new Promise((resolve) => {
      this.#localWebSocket = uwsOptions.isSSL ? uWS.SSLApp(uwsOptions.appOptions) : uWS.App(uwsOptions.appOptions)

      this.#localWebSocket.ws("/*", {
        ...uwsOptions.wsOptions,

        open: (ws) => {
          console.log("[ClientManager][WS] on Open", `IP: ${Buffer.from(ws.getRemoteAddressAsText()).toString()}`)

          extendWs(ws)
        },

        close: async (ws, code, message) => {
          await onClose(ws)

          removeWsExtends(ws)
        },

        message: async (ws, message, isBinary) => {
          try {
            const stringMessage = decodeMessage(message)
            await onMessage(ws, stringMessage)
          } catch (err) {
            console.log("[ClientManager][WS] onMessage error", err)
            socketOnErrorProcessingMessage(ws, err, stringMessage)
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
      const extendSocket = (socket) => {
        socket.safeSend = tcpSafeSend.bind(socket, socket)
        socket.multipleSafeSend = socketMultipleSafeSend.bind(socket, socket)
      }
  
      const removeSocketExtends = (socket) => {
        socket.safeSend = void 0
        socket.multipleSafeSend = void 0
      }

      const decodeMessage = (socket, message) => {
        const stringMessage = decoder.write(Buffer.from(message))?.trim()
        console.log("[RECV]", stringMessage, stringMessage.length)
      
        if (!stringMessage.length) {
          return []
        }

        if (!socket.apiType) {
          const apiType = detectAPIType(socket, stringMessage)
          if (!apiType) {
            throw new Error("Unknown message format")
          }
          socket.apiType = apiType.at(0)
        }
      
        const api = APIs[socket.apiType]
      
        const splittedMessages = api.splitPacket(stringMessage)
      
        console.log("[RECV][splitted]", splittedMessages)

        return { stringMessage, splittedMessages }
      }

      const tcpOnData = async function (message) {
        try {
          const { stringMessage, splittedMessages } = decodeMessage(this, message)
          message = stringMessage

          for (const message of splittedMessages) {
            await onMessage(this, message)
          }
        } catch (err) {
          console.log("[ClientManager][TCP] onMessage error", err)
          socketOnErrorProcessingMessage(this, err, message)
        }
      }

      const tcpOnClose = async function () {
        await onClose(this)
      }

      const tcpOnError = function (err) {
        console.log("[ClientManager][TCP] socket error", err)
      }

      const socketListeners = (socket, isTls) => {
        extendSocket(socket)

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
        removeSocketExtends(socket)

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
