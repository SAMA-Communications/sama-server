import BaseController from "@sama/common/controller.js"

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

  getCookie(req) {
    return req.getHeader("cookie")
  }

  setRefreshTokenCookie(res, token) {
    res.writeHeader("Set-Cookie", `refresh_token=${token}; HttpOnly; SameSite=Lax;`)
  }

  sendError(res, status, message) {
    if (!res.aborted) res.writeStatus(status.toString()).end(JSON.stringify({ message }))
  }

  sendSuccess(res, data) {
    if (!res.aborted) res.writeStatus("200").end(JSON.stringify(data))
  }
}
