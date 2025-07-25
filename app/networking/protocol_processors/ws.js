import uWS from "uWebSockets.js"

import { CONSTANTS as MAIN_CONSTANTS } from "../../constants/constants.js"
import logger from "../../logger/index.js"
import { asyncLoggerContextStore, createStore } from "../../logger/async_store.js"
import BaseProtocolProcessor from "./base.js"
import { wsSafeSend } from "../../utils/sockets-utils.js"

class WsProtocol extends BaseProtocolProcessor {
  uwsOptions = {}
  uWSocket = void 0

  requestCreateStoreContext = () => createStore({ [MAIN_CONSTANTS.LOGGER_BINDINGS_NAMES.PROTOCOL_TYPE]: "WS" })

  socketAddress(ws) {
    return Buffer.from(ws.getRemoteAddressAsText()).toString()
  }

  onOpen(ws) {
    logger.debug("[Open] IP: %s", this.socketAddress(ws))
    super.onOpen(ws)
  }

  extendSocket(ws) {
    ws.safeSend = wsSafeSend.bind(ws, ws)
  }

  removeExtends(ws) {
    ws.safeSend = void 0
  }

  async onClose(ws, code, message) {
    logger.debug("[Close] Code: %s", code)

    return super.onClose(ws)
  }

  async onPackage(ws, packageData, isBinary) {
    return super.onPackage(ws, packageData)
  }

  listen(uwsOptions) {
    this.uwsOptions = uwsOptions

    return new Promise((resolve) => {
      this.uWSocket = uwsOptions.isSSL ? uWS.SSLApp(uwsOptions.appOptions) : uWS.App(uwsOptions.appOptions)

      this.uWSocket.ws("/*", {
        ...uwsOptions.wsOptions,

        open: (ws) => {
          asyncLoggerContextStore.run(this.requestCreateStoreContext(), () => {
            this.onOpen(ws)
          })
        },

        close: (ws, code, message) => {
          asyncLoggerContextStore.run(this.requestCreateStoreContext(), () => {
            this.onClose(ws, code, message)
          })
        },

        message: (ws, message, isBinary) => {
          asyncLoggerContextStore.run(this.requestCreateStoreContext(), () => {
            this.onPackage(ws, message, isBinary)
          })
        },
      })

      this.uWSocket.listen(uwsOptions.port, uwsOptions.listenOptions, (listenSocket) => {
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
