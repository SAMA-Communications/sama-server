import uWS from "uWebSockets.js"

import { CONSTANTS as MAIN_CONSTANTS } from "../../constants/constants.js"
import logger from "../../logger/index.js"
import { asyncLoggerContextStore, createStore } from "../../logger/async_store.js"
import BaseProtocolProcessor from "./base.js"
import { wsSafeSend } from "../../utils/sockets-utils.js"

class WsProtocol extends BaseProtocolProcessor {
  uwsOptions = {}
  uWSocketServer = void 0

  static defineProtocolTpe(socket) {
    return "WS"
  }

  socketAddress(ws) {
    try {
      return Buffer.from(ws.getRemoteAddressAsText()).toString()
    } catch (error) {
      return "no-ip"
    }
  }

  extendSocket(ws) {
    super.extendSocket(ws)
    ws.safeSend = wsSafeSend.bind(ws, ws)
    return ws
  }

  removeExtends(ws) {
    super.removeExtends(ws)
    ws.safeSend = void 0
    return ws
  }

  async onPackage(ws, packageData, isBinary) {
    return super.onPackage(ws, packageData)
  }

  listen(uwsOptions) {
    this.uwsOptions = uwsOptions

    return new Promise((resolve) => {
      this.uWSocketServer = uwsOptions.isSSL ? uWS.SSLApp(uwsOptions.appOptions) : uWS.App(uwsOptions.appOptions)

      this.uWSocketServer.ws("/*", {
        ...uwsOptions.wsOptions,

        open: (ws) => {
          asyncLoggerContextStore.run(this.requestCreateStoreContext(ws), () => {
            this.onOpen(ws)
          })
        },

        close: (ws, code, message) => {
          asyncLoggerContextStore.run(this.requestCreateStoreContext(ws), () => {
            this.onClose(ws, code, message)
          })
        },

        message: (ws, message, isBinary) => {
          asyncLoggerContextStore.run(this.requestCreateStoreContext(ws), () => {
            this.onPackage(ws, message, isBinary)
          })
        },
      })

      this.uWSocketServer.listen(uwsOptions.port, uwsOptions.listenOptions, (listenSocket) => {
        if (!listenSocket) {
          throw new Error(`[WS] can't allocate port`)
        }

        logger.debug("[WS] listening on port %s", uWS.us_socket_local_port(listenSocket))

        return resolve(uwsOptions.port)
      })
    })
  }
}

export default WsProtocol
