import { default as XML } from "@xmpp/xml"
import { default as XMLParser } from "@xmpp/xml/lib/parse.js"

import BasePacketProcessor from "@sama/common/packet_processor.js"
import { routes } from "./routes.js"

class PacketXmppProcessor extends BasePacketProcessor {
  constructor() {
    super()
    this.router = routes;
  }

  #parseMessage(message) {
    return XMLParser(message)
  }

  async #processMessage(ws, xmlElement) {
    const routeName = xmlElement.name
    return await this.router[routeName](ws, xmlElement)
  }

  async processMessageOrError(ws, message) {
    let responseData
    let xmlElement
    try {
      xmlElement = this.#parseMessage(message)
      responseData = await this.#processMessage(ws, xmlElement)
    } catch (error) {
      console.error(e)
      responseData = this.#buildError(error)
    }

    return responseData
  }

  #buildError(error) {
    return XML('error', {}, error.cause || error.message)
  }
}

export default new PacketXmppProcessor();
