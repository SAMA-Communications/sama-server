import uWS from "uWebSockets.js"

import BaseProtocolProcessor from "./base.js"
import HttpProtocol from "./http.js"
import { CONSTANTS as MAIN_CONSTANTS } from "../../constants/constants.js"
import { wsSafeSend } from "../../utils/sockets-utils.js"

class WsProtocol extends BaseProtocolProcessor {
  uwsOptions = {}
  httpServerApp = void 0
  webSocket = void 0

  onOpen(ws) {
    console.log("[ClientManager][WS] on Open", `IP: ${Buffer.from(ws.getRemoteAddressAsText()).toString()}`)
    super.onOpen(ws)
  }

  extendSocket(ws) {
    ws.safeSend = wsSafeSend.bind(ws, ws)
  }

  removeExtends(ws) {
    ws.safeSend = void 0
  }

  async onClose(ws, code, message) {
    console.log("[ClientManager][WS] on close", code, message)

    return super.onClose(ws)
  }

  async onPackage(ws, packageData, isBinary) {
    return super.onPackage(ws, packageData)
  }

  listen(uwsOptions) {
    this.uwsOptions = uwsOptions

    return new Promise((resolve) => {
      this.webSocket = uwsOptions.isSSL ? uWS.SSLApp(uwsOptions.appOptions) : uWS.App(uwsOptions.appOptions)

      this.webSocket.ws("/*", {
        ...uwsOptions.wsOptions,

        open: (ws) => this.onOpen(ws),

        close: (ws, code, message) => this.onClose(ws, code, message),

        message: (ws, message, isBinary) => this.onPackage(ws, message, isBinary),
      })

      this.webSocket.listen(uwsOptions.port, uwsOptions.listenOptions, (listenSocket) => {
        if (!listenSocket) {
          throw new Error(`[ClientManager][WS] can't allocate port`)
        }

        console.log(`[ClientManager][WS] listening on port ${uWS.us_socket_local_port(listenSocket)}, pid=${process.pid}`)

        return resolve(uwsOptions.port)
      })
    })
  }

  async unbindSessionCallback(wsKey) {
    const session = this.sessionService.getSession(wsKey)
    if (!session?.userId) {
      return
    }

    await this.sessionService.removeUserSession(wsKey, session.userId, MAIN_CONSTANTS.HTTP_DEVICE_ID)
  }

  listenHttp(httpOptions) {
    this.httpServerApp = new HttpProtocol(this.webSocket)
    this.httpServerApp.setResponseProcessor(this.processAPIResponse.bind(this))
    this.httpServerApp.setUnbindSessionCallback(this.unbindSessionCallback.bind(this))
    this.httpServerApp.bindRoutes()

    console.log(`[ClientManager][HTTP] listening on [WS] port, pid=${process.pid}`)
  }
}

export default WsProtocol
