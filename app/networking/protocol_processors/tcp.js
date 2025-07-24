import net from "net"
import tls from "tls"

import logger from "../../logger/index.js"
import { asyncLoggerContextStore, createStore, updateStoreContext } from "../../logger/async_store.js"

import BaseProtocolProcessor from "./base.js"
import { APIs, detectAPIType } from "../APIs.js"
import { tcpSafeSend } from "../../utils/sockets-utils.js"

class TcpProtocol extends BaseProtocolProcessor {
  tcpOptions = {}
  tcpSocket = void 0

  requestCreateStoreContext = (socket) => createStore({ pType: socket ? (socket instanceof tls.TLSSocket ? "TLS" : "TCP") : "TCP" })

  socketAddress(socket) {
    return `${socket.remoteAddress}`
  }

  socketListenerOnData = function () {}
  socketListenerOnClose = function () {}
  socketListenerOnUpgrade = function () {}
  socketListenerOnError = function () {}

  onOpen(socket, isTls) {
    logger.debug("[Open] IP: %s", this.socketAddress(socket))
    super.onOpen(socket)
    this.setUpSocketListeners(socket, isTls)
  }

  extendSocket(socket) {
    socket.safeSend = tcpSafeSend.bind(socket, socket)
  }

  removeExtends(socket) {
    socket.safeSend = void 0
  }

  async onClose(socket) {
    logger.debug("[Close] IP: %s", this.socketAddress(socket))

    await super.onClose(socket)

    this.removeSocketListeners(socket)
  }

  async processPackage(socket, decodedPackage) {
    if (!decodedPackage?.length) {
      return
    }

    if (!socket.apiType) {
      const apiType = detectAPIType(socket, decodedPackage)
      if (!apiType) {
        throw new Error("Unknown message format")
      }
      socket.apiType = apiType.at(0)
    }

    const api = APIs[socket.apiType]

    const splittedPackages = api.splitPacket(decodedPackage)

    logger.debug("[RECV][splitted] %j", splittedPackages)

    for (const splittedPackage of splittedPackages) {
      await super.processPackage(socket, splittedPackage)
    }
  }

  prepareSocketsListeners() {
    const self = this

    this.socketListenerOnData = function (packageData) {
      self.onSocketData(this, packageData)
    }

    this.socketListenerOnClose = function () {
      self.onSocketClose(this)
    }

    this.socketListenerOnUpgrade = function () {
      self.onSocketTlsUpgrade(this)
    }

    this.socketListenerOnError = function (error) {
      self.onSocketError(this, error)
    }
  }

  onSocketData(socket, packageData) {
    asyncLoggerContextStore.run(this.requestCreateStoreContext(socket), () => {
      this.onPackage(socket, packageData)
    })
  }

  onSocketClose(socket) {
    asyncLoggerContextStore.run(this.requestCreateStoreContext(socket), () => {
      this.onClose(socket)
    })
  }

  onSocketError(socket, error) {
    asyncLoggerContextStore.run(this.requestCreateStoreContext(socket), () => {
      logger.error(error)
    })
  }

  onSocketTlsUpgrade(socket) {
    logger.debug("[Upgrade To TLS]")

    this.removeSocketListeners(socket)

    const options = {
      isServer: true,
      key: this.tcpOptions.key,
      cert: this.tcpOptions.cert,
    }

    const tlsSocket = new tls.TLSSocket(socket, options)

    updateStoreContext("pType", "TLS")

    this.onOpen(tlsSocket, true)
  }

  setUpSocketListeners(socket, isTls) {
    socket.on("data", this.socketListenerOnData)
    socket.on("close", this.socketListenerOnClose)
    socket.on("error", this.socketListenerOnError)

    if (!isTls) {
      socket.once("upgrade", this.socketListenerOnUpgrade)
    }
  }

  removeSocketListeners(socket) {
    socket.removeListener("data", this.socketListenerOnData)
    socket.removeListener("close", this.socketListenerOnClose)
    socket.removeListener("error", this.socketListenerOnError)

    socket.removeListener("upgrade", this.socketListenerOnUpgrade)
  }

  listen(tcpOptions) {
    this.tcpOptions = tcpOptions

    this.prepareSocketsListeners()

    return new Promise((resolve) => {
      this.tcpSocket = net.createServer((socket) => {
        asyncLoggerContextStore.run(this.requestCreateStoreContext(), () => {
          this.onOpen(socket)
        })
      })

      asyncLoggerContextStore.run(this.requestCreateStoreContext(), () => {
        this.tcpSocket.listen(tcpOptions.port, () => {
          logger.debug("listening on port %s", tcpOptions.port)

          return resolve(tcpOptions.port)
        })
      })
    })
  }
}

export default TcpProtocol
