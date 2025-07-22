import net from "net"
import tls from "tls"

import BaseProtocolProcessor from "./base.js"
import { APIs, detectAPIType } from "../APIs.js"
import { tcpSafeSend } from "../../utils/sockets-utils.js"

class TcpProtocol extends BaseProtocolProcessor {
  tcpOptions = {}
  tcpSocket = void 0

  socketListenerOnData = function () {}
  socketListenerOnClose = function () {}
  socketListenerOnUpgrade = function () {}

  onOpen(socket, isTls) {
    console.log("[ClientManager][TCP] on Open", `IP: ${socket.remoteAddress}`)
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
    console.log("[ClientManager][TCP] on close", `IP: ${socket.remoteAddress}`)

    await super.onClose(socket)

    this.removeSocketListeners(socket)
  }

  decodeAndSplitPackage(socket, buffer) {
    const stringPackage = this.decodePackage(socket, buffer)

    if (!stringPackage?.length) {
      return []
    }

    if (!socket.apiType) {
      const apiType = detectAPIType(socket, stringPackage)
      if (!apiType) {
        throw new Error("Unknown message format")
      }
      socket.apiType = apiType.at(0)
    }

    const api = APIs[socket.apiType]

    const splittedPackages = api.splitPacket(stringPackage)

    console.log("[RECV][splitted]", splittedPackages)

    return splittedPackages
  }

  async onPackage(socket, packageData) {
    const splittedPackages = this.decodeAndSplitPackage(socket, packageData)

    for (const splittedPackage of splittedPackages) {
      await super.onPackage(socket, splittedPackage, true)
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
  }

  onSocketData(socket, packageData) {
    this.onPackage(socket, packageData)
  }

  onSocketClose(socket) {
    this.onClose(socket)
  }

  onSocketError(error) {
    console.log("[ClientManager][TCP] socket error", error)
  }

  onSocketTlsUpgrade(socket) {
    console.log("[Upgrade]")

    this.removeSocketListeners(socket)

    const options = {
      isServer: true,
      key: this.tcpOptions.key,
      cert: this.tcpOptions.cert,
    }

    const tlsSocket = new tls.TLSSocket(socket, options)

    tlsSocket.on("secureConnect", () => {
      console.log("TLS handshake complete")
    })

    this.onOpen(tlsSocket, true)
  }

  setUpSocketListeners(socket, isTls) {
    socket.on("data", this.socketListenerOnData)
    socket.on("close", this.socketListenerOnClose)
    socket.on("error", this.onSocketError)

    if (!isTls) {
      socket.once("upgrade", this.socketListenerOnUpgrade)
    }
  }

  removeSocketListeners(socket) {
    socket.removeListener("data", this.socketListenerOnData)
    socket.removeListener("close", this.socketListenerOnClose)
    socket.removeListener("error", this.onSocketError)

    socket.removeListener("upgrade", this.socketListenerOnUpgrade)
  }

  listen(tcpOptions) {
    this.tcpOptions = tcpOptions

    this.prepareSocketsListeners()

    return new Promise((resolve) => {
      this.tcpSocket = net.createServer((socket) => this.onOpen(socket))

      this.tcpSocket.listen(tcpOptions.port, () => {
        console.log(`[ClientManager][TCP] listening on port ${tcpOptions.port}, pid=${process.pid}`)

        return resolve(tcpOptions.port)
      })
    })
  }
}

export default TcpProtocol
