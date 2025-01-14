import BaseController from "@sama/common/controller.js"

import signature from "cookie-signature"

export default class BaseHttpController extends BaseController {
  async parseJsonBody(res) {
    return new Promise((resolve, reject) => {
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
  }

  #setCorsHeaders(res) {
    res.writeHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*")
    res.writeHeader("Access-Control-Allow-Credentials", "true")
    res.writeHeader("Access-Control-Allow-Methods", "POST")
    res.writeHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  }

  getCookie(req) {
    return req.getHeader("cookie")
  }

  setStatus(res, status) {
    res.writeStatus(`${status}`)
    return this
  }

  setRefreshToken(res, token, isRemove = false) {
    const signedToken = `s:` + signature.sign(token, process.env.COOKIE_SECRET)
    res.writeHeader(
      "Set-Cookie",
      `refresh_token=${signedToken}; Max-Age=${isRemove ? 0 : process.env.JWT_REFRESH_TOKEN_EXPIRES_IN}; HttpOnly; SameSite=Lax; Secure;`
    )
    return this
  }

  sendResponse(res, data) {
    this.#setCorsHeaders(res)
    res.end(JSON.stringify(data))
  }
}
