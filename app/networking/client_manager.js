import uWS from "uWebSockets.js"
import { StringDecoder } from "string_decoder"

import { CONSTANTS as MAIN_CONSTANTS } from "../constants/constants.js"
import { ERROR_STATUES } from "../constants/errors.js"

import { BASE_API, APIs, detectAPIType } from "./APIs.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import HttpAuthController from "../../APIs/JSON/controllers/http/auth.js"
import HttpMessageController from "../../APIs/JSON/controllers/http/message.js"

import packetManager from "./packet_manager.js"
import packetMapper from "./packet_mapper.js"

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

const fakeWsSessionBindMiddleware = async (res, req) => {
  res.fakeWsSessionKey = Symbol("Http ws fake session")
}

const corsHeadersMiddleware = async (res, req) => {
  if (req.getMethod() !== "options") {
    return
  }

  res.writeHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*")
  res.writeHeader("Access-Control-Allow-Credentials", "true")
  res.writeHeader("Access-Control-Allow-Methods", "POST, PUT")
  res.writeHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, API-Key")
}

const parseJsonBodyMiddleware = async (res, req) => {
  if (req.getHeader("content-type") !== "application/json") {
    return
  }

  const parsedBodyPromise = new Promise((resolve, reject) => {
    let buffer = Buffer.alloc(0)
    res.onData((chunk, isLast) => {
      buffer = Buffer.concat([buffer, Buffer.from(chunk)])
      if (isLast) {
        try {
          resolve(JSON.parse(buffer.toString()))
        } catch (error) {
          reject(new Error("Invalid JSON input"))
        }
      }
    })

    res.onAborted(() => reject(new Error("Request aborted")))
  })

  res.parsedBody = await parsedBodyPromise
}

const adminApiKeyValidationMiddleware = async (res, req) => {
  const apiKey = req.getHeader(MAIN_CONSTANTS.HTTP_ADMIN_API_KEY_HEADER)

  if (apiKey !== process.env.HTTP_ADMIN_API_KEY) {
    throw new Error(ERROR_STATUES.UNAUTHORIZED.message, {
      cause: ERROR_STATUES.UNAUTHORIZED,
    })
  }
}

const processHttpResponseMiddleware = async (res, req, handlerResponse) => {
  console.log("[Http][Response]", handlerResponse)

  const responseBody = handlerResponse.backMessages.at(0)
  handlerResponse.backMessages = []

  res.writeHeader("Content-Type", "application/json")
  res.writeStatus(`${200}`)
  res.end(JSON.stringify(responseBody || {}))

  await processMessageResponse(res.fakeWsSessionKey, APIs[BASE_API].stringifyResponse(handlerResponse))
}

const onHttpRequest = (preMiddleware = [], handler) => {
  return async (res, req) => {
    try {
      console.log(
        "[Http][Request]",
        req.getMethod(),
        req.getUrl(),
        req.getHeader("content-type"),
        req.getHeader("content-length")
      )

      await fakeWsSessionBindMiddleware(res, req)
      await corsHeadersMiddleware(res, req)

      for (const middleware of preMiddleware) {
        await middleware(res, req)
      }

      await parseJsonBodyMiddleware(res, req)

      const handlerResponse = await handler(res, req)

      if (handlerResponse) {
        await processHttpResponseMiddleware(res, req, handlerResponse)
      } else {
        res.writeStatus(`200`)
        res.end("Ok")
      }
    } catch (error) {
      console.log("[Http][Error]", error)

      res.writeStatus(`${error.cause?.status || 500}`)
      res.end(error.message || "Server error")
    } finally {
      const sessionService = ServiceLocatorContainer.use("SessionService")
      await sessionService.removeAllUserSessions(res.fakeWsSessionKey)
    }
  }
}

const processMessageResponse = async (ws, response) => {
  if (response.lastActivityStatusResponse) {
    const sessionService = ServiceLocatorContainer.use("SessionService")

    const userId = response.lastActivityStatusResponse.userId || sessionService.getSessionUserId(ws)
    console.log("[UPDATE_LAST_ACTIVITY]", userId, response.lastActivityStatusResponse)
    const responses = await activitySender.updateAndSendUserActivity(
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

class ClientManager {
  #localSocket = null

  #setCorsHeaders(res) {
    res.writeHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*")
    res.writeHeader("Access-Control-Allow-Credentials", "true")
    res.writeHeader("Access-Control-Allow-Methods", "POST")
    res.writeHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  }

  #handleHttpRequest(handler, withCors = false) {
    return (res, req) => {
      withCors && this.#setCorsHeaders(res)
      res.onAborted(() => (res.aborted = true))
      handler(res, req)
    }
  }

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

          await activitySender.updateAndSendUserActivity(ws, userId, MAIN_CONSTANTS.LAST_ACTIVITY_STATUS.OFFLINE)
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

      this.#localSocket.options(
        "/*",
        onHttpRequest([], () => void 0)
      )

      this.#localSocket.post(
        "/login",
        this.#handleHttpRequest((res, req) => HttpAuthController.login(res, req))
      )

      this.#localSocket.post(
        "/logout",
        this.#handleHttpRequest((res, req) => HttpAuthController.logout(res, req))
      )

      this.#localSocket.post(
        "/admin/message",
        onHttpRequest([adminApiKeyValidationMiddleware], HttpMessageController.message)
      )

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
