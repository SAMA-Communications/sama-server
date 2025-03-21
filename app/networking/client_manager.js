import uWS from "uWebSockets.js"
import { StringDecoder } from "string_decoder"

import { CONSTANTS as MAIN_CONSTANTS } from "../constants/constants.js"
import { ERROR_STATUES } from "../constants/errors.js"

import { parserCookies, serializeCookie } from "../../APIs/JSON/utils/cookie-tools.js"

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

const parseBaseParamsMiddleware = async (res, req) => {
  res.fakeWsSessionKey = Symbol("Http ws fake session")

  res.parsedHeaders = {}

  req.forEach((headerName, value) => {
    res.parsedHeaders[headerName] = value
  })

  res.parsedCookies = {}
  res.parsedSignedCookies = {}

  if (res.parsedHeaders["cookie"]) {
    try {
      const { cookies, signedCookies } = parserCookies(res.parsedHeaders["cookie"])
      res.parsedCookies = cookies
      res.parsedSignedCookies = signedCookies
    } catch (error) {
      console.log("[Http][Request][cookieParser][error]", error)
    }
  }
}

const corsHeadersMiddleware = async (res, req) => {
  res.writeHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*")
  res.writeHeader("Access-Control-Allow-Credentials", "true")
  res.writeHeader("Access-Control-Allow-Methods", "POST, PUT, DELETE")
  res.writeHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, API-Key")
}

const parseJsonBodyMiddleware = async (res, req) => {
  res.rawBody = Buffer.alloc(0)
  res.parsedBody = {}

  const readRawBodyPromise = new Promise((resolve, reject) => {
    let buffer = Buffer.alloc(0)
    res.onData((chunk, isLast) => {
      buffer = Buffer.concat([buffer, Buffer.from(chunk)])
      if (isLast) {
        resolve(buffer)
      }
    })

    res.onAborted(() => reject(new Error("Request aborted")))
  })

  res.rawBody = await readRawBodyPromise

  const contentType = res.parsedHeaders["content-type"]
  const contentLength = +res.parsedHeaders["content-length"]

  if (contentType !== "application/json" || !contentLength) {
    return
  }

  try {
    res.parsedBody = JSON.parse(res.rawBody.toString())
  } catch (error) {
    console.log('[Http][parseJSONBody][error]', error)
  }
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

  const { httpResponse } = handlerResponse

  if (httpResponse.cookies.length) {
    const preparedCookies = []

    for (const cookieParams of httpResponse.cookies) {
      const preparedCookie = serializeCookie(cookieParams.name, cookieParams.value, cookieParams.options)
      preparedCookies.push(preparedCookie)
    }

    const cookieHeaderStr = preparedCookies.join("; ")

    httpResponse.addHeader("Set-Cookie", cookieHeaderStr)
  }

  const bodyStr = httpResponse.stringifyBody()

  res.cork(() => {
    res.writeHeader("Content-Type", "application/json")
    for (const [headerKey, value] of Object.entries(httpResponse.headers)) {
      res.writeHeader(headerKey, value)
    }

    res.writeStatus(`${httpResponse.status || 200}`)

    res.end(bodyStr)
  })

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

      await parseBaseParamsMiddleware(res, req)
      await corsHeadersMiddleware(res, req)

      for (const middleware of preMiddleware) {
        await middleware(res, req)
      }

      await parseJsonBodyMiddleware(res, req)

      const handlerResponse = await handler(res, req)

      if (handlerResponse) {
        await processHttpResponseMiddleware(res, req, handlerResponse)
      } else {
        res.cork(() => {
          res.writeHeader("Content-Type", "text/plain")
          res.writeStatus(`200`)
          res.end("Ok")
        })
      }
    } catch (error) {
      console.log("[Http][Error]", error)

      res.cork(() => {
        res.writeHeader("Content-Type", "text/plain")
        res.writeStatus(`${error.cause?.status ?? ERROR_STATUES.INTERNAL_SERVER.status}`)
        res.end(error.message ?? ERROR_STATUES.INTERNAL_SERVER.message)
      })
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

      this.#localSocket.post("/login", onHttpRequest([], HttpAuthController.login))

      this.#localSocket.post("/logout", onHttpRequest([], HttpAuthController.logout))

      this.#localSocket.post(
        "/admin/message/system",
        onHttpRequest([adminApiKeyValidationMiddleware], HttpMessageController.system_message)
      )

      this.#localSocket.put(
        "/admin/message/read",
        onHttpRequest([adminApiKeyValidationMiddleware], HttpMessageController.read)
      )

      this.#localSocket.put(
        "/admin/message",
        onHttpRequest([adminApiKeyValidationMiddleware], HttpMessageController.edit)
      )

      this.#localSocket.del(
        "/admin/message",
        onHttpRequest([adminApiKeyValidationMiddleware], HttpMessageController.delete)
      )

      this.#localSocket.post(
        "/admin/message",
        onHttpRequest([adminApiKeyValidationMiddleware], HttpMessageController.message)
      )

      this.#localSocket.any(
        "/*",
        onHttpRequest([], (res, req) => {
          throw new Error(ERROR_STATUES.ROUTE_NOT_FOUND.message, { cause: ERROR_STATUES.ROUTE_NOT_FOUND })
        })
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
