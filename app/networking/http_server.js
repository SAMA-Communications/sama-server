import { CONSTANTS as MAIN_CONSTANTS } from "../constants/constants.js"
import { ERROR_STATUES } from "../constants/errors.js"

import { parserCookies, serializeCookie } from "../../APIs/JSON/utils/cookie-tools.js"

import HttpAuthController from "../../APIs/JSON/controllers/http/auth.js"
import HttpMessageController from "../../APIs/JSON/controllers/http/message.js"
import HttpActivityController from "../../APIs/JSON/controllers/http/activity.js"
import HttpOrganizationController from "../../APIs/JSON/controllers/http/organization.js"

import HttpResponse from "@sama/networking/models/HttpResponse.js"
import Response from "@sama/networking/models/Response.js"

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

const addCorsHeaders = (res, req) => {
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

  if (!contentType?.includes("application/json") || !contentLength) {
    return
  }

  try {
    res.parsedBody = JSON.parse(res.rawBody.toString())
    console.log("[Http][payload]", res.parsedBody)
  } catch (error) {
    console.log("[Http][parseJSONBody][error]", error)
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

const optionsRequestHandler = async (res, req) => {
  const httpResponse = new HttpResponse(204, {}, null)

  return new Response().setHttpResponse(httpResponse)
}

const healthCheckHandler = async (res, req) => {
  const httpResponse = new HttpResponse(200, { "Content-Type": "application/json" }, { status: "ok" })

  return new Response().setHttpResponse(httpResponse)
}

export default class HttpServerApp {
  uWSLocalSocket = null
  responseProcessor = null
  unbindSessionCallback = null

  constructor(uWSLocalSocket) {
    this.uWSLocalSocket = uWSLocalSocket
  }

  setResponseProcessor(responseProcessor) {
    this.responseProcessor = responseProcessor
  }

  setUnbindSessionCallback(unbindSessionCallback) {
    this.unbindSessionCallback = unbindSessionCallback
  }

  async processHttpResponseMiddleware(res, req, handlerResponse) {
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
    const emptyBody = !bodyStr
    const status = emptyBody ? 204 : httpResponse.status || 200

    res.cork(() => {
      res.writeStatus(`${status}`)

      addCorsHeaders(res, req)
      if (!emptyBody) {
        res.writeHeader("Content-Type", "application/json")
      }
      for (const [headerKey, value] of Object.entries(httpResponse.headers)) {
        res.writeHeader(headerKey, value)
      }

      emptyBody ? res.endWithoutBody() : res.end(bodyStr)
    })

    await this.responseProcessor(res.fakeWsSessionKey, handlerResponse, true)
  }

  onHttpRequestHandler(preMiddleware = [], handler) {
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

        for (const middleware of preMiddleware) {
          await middleware(res, req)
        }

        await parseJsonBodyMiddleware(res, req)

        const handlerResponse = await handler(res, req)

        if (handlerResponse) {
          await this.processHttpResponseMiddleware(res, req, handlerResponse)
        } else {
          res.cork(() => {
            res.writeStatus(`200`)

            addCorsHeaders(res, req)
            res.writeHeader("Content-Type", "text/plain")

            res.end("Ok")
          })
        }
      } catch (error) {
        console.log("[Http][Error]", error)

        res.cork(() => {
          res.writeStatus(`${error.cause?.status ?? ERROR_STATUES.INTERNAL_SERVER.status}`)

          addCorsHeaders(res, req)
          res.writeHeader("Content-Type", "text/plain")

          res.end(error.message ?? ERROR_STATUES.INTERNAL_SERVER.message)
        })
      } finally {
        await this.unbindSessionCallback(res.fakeWsSessionKey)
      }
    }
  }

  bindRoutes() {
    this.uWSLocalSocket.options("/*", this.onHttpRequestHandler([], optionsRequestHandler))

    this.uWSLocalSocket.get("/health", this.onHttpRequestHandler([], healthCheckHandler))

    this.uWSLocalSocket.post("/login", this.onHttpRequestHandler([], HttpAuthController.login))

    this.uWSLocalSocket.post("/logout", this.onHttpRequestHandler([], HttpAuthController.logout))

    this.uWSLocalSocket.post(
      "/admin/organization",
      this.onHttpRequestHandler([adminApiKeyValidationMiddleware], HttpOrganizationController.create)
    )

    this.uWSLocalSocket.post(
      "/admin/message/system",
      this.onHttpRequestHandler([adminApiKeyValidationMiddleware], HttpMessageController.system_message)
    )

    this.uWSLocalSocket.put(
      "/admin/message/read",
      this.onHttpRequestHandler([adminApiKeyValidationMiddleware], HttpMessageController.read)
    )

    this.uWSLocalSocket.put(
      "/admin/message",
      this.onHttpRequestHandler([adminApiKeyValidationMiddleware], HttpMessageController.edit)
    )

    this.uWSLocalSocket.put(
      "/admin/message/reaction",
      this.onHttpRequestHandler([adminApiKeyValidationMiddleware], HttpMessageController.reaction)
    )

    this.uWSLocalSocket.del(
      "/admin/message",
      this.onHttpRequestHandler([adminApiKeyValidationMiddleware], HttpMessageController.delete)
    )

    this.uWSLocalSocket.post(
      "/admin/message",
      this.onHttpRequestHandler([adminApiKeyValidationMiddleware], HttpMessageController.message)
    )

    this.uWSLocalSocket.post(
      "/admin/activity/online",
      this.onHttpRequestHandler([adminApiKeyValidationMiddleware], HttpActivityController.online_list)
    )

    this.uWSLocalSocket.any(
      "/*",
      this.onHttpRequestHandler([], (res, req) => {
        throw new Error(ERROR_STATUES.ROUTE_NOT_FOUND.message, { cause: ERROR_STATUES.ROUTE_NOT_FOUND })
      })
    )
  }
}
