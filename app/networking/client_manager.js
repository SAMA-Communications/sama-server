import uWS from "uWebSockets.js"
import { StringDecoder } from "string_decoder"

import { CONSTANTS as MAIN_CONSTANTS } from "../constants/constants.js"
import { ERROR_STATUES } from "../constants/errors.js"

import { APIs, detectAPIType } from "./APIs.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

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

  #sendError(res, status, message) {
    if (!res.aborted) {
      res.writeStatus(status.toString()).end(JSON.stringify({ message }))
    }
  }

  #sendSuccess(res, data) {
    if (!res.aborted) {
      res.writeStatus("200").end(JSON.stringify(data))
    }
  }

  #readJson(res, cb) {
    let buffer = Buffer.alloc(0)
    res.onData((ab, isLast) => {
      let chunk = Buffer.from(ab)
      buffer = Buffer.concat([buffer, chunk])
      if (isLast) {
        try {
          cb(JSON.parse(buffer))
        } catch (e) {
          cb(null)
        }
      }
    })
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

      this.#localSocket.options("/login", (res) => {
        this.#setCorsHeaders(res)
        res.end()
      })

      this.#localSocket.post("/login", async (res, req) => {
        this.#setCorsHeaders(res)

        res.onAborted(() => (res.aborted = true))

        try {
          const cookieHeader = req.getHeader("cookie")
          const refreshToken = cookieHeader
            ? cookieHeader
                .split("; ")
                .find((cookie) => cookie.startsWith("refresh_token="))
                ?.split("=")[1]
            : null

          this.#readJson(res, async (requestData) => {
            const { login, password, access_token, device_id } = requestData
            if (!device_id) {
              return this.#sendError(res, ERROR_STATUES.DEVICE_ID_MISSED.status, ERROR_STATUES.DEVICE_ID_MISSED.message)
            }

            const userAuthOperation = ServiceLocatorContainer.use("UserAuthOperation")
            const userInfo = { device_id }
            let needToUpdateRefreshToken = true

            //any validation for req fields?
            if (login && password) {
              userInfo.login = login
              userInfo.password = password
            } else if (access_token) {
              userInfo.token = access_token
              needToUpdateRefreshToken = false
            } else if (refreshToken) {
              userInfo.token = refreshToken
            } else {
              return this.#sendError(res, 400, "Missing authentication credentials")
            }

            try {
              const { user, token: accessToken } = await userAuthOperation.perform(null, userInfo)

              let newRefreshToken
              if (needToUpdateRefreshToken) {
                newRefreshToken = await userAuthOperation.createRefreshToken(user, device_id)
                res.writeHeader("Set-Cookie", `refresh_token=${newRefreshToken.token}; HttpOnly; SameSite=Lax;`)
              }

              const accessTokenExpiredAt =
                new Date(accessToken.created_at).getTime() + process.env.JWT_ACCESS_TOKEN_EXPIRES_IN * 1000

              this.#sendSuccess(res, {
                user,
                access_token: accessToken.token,
                expired_at: accessTokenExpiredAt,
              })
            } catch (err) {
              this.#sendError(res, err.cause?.status || 500, err.cause?.message || "Internal server error")
            }
          })
        } catch (err) {
          this.#sendError(res, 500, "Unexpected server error")
        }
      })

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
