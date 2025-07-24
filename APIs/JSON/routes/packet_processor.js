import logger from "@sama/logger/index.js"
import { updateStoreContext } from "@sama/logger/async_store.js"

import BasePacketProcessor from "@sama/common/packet_processor.js"
import Response from "@sama/networking/models/Response.js"
import { routes } from "./routes.js"

class PacketJsonProcessor extends BasePacketProcessor {
  constructor() {
    super()
    this.router = routes
  }

  #parseMessage(message) {
    return JSON.parse(message)
  }

  async #processMessage(ws, json) {
    let reqFirstParams = Object.keys(json)[0]
    let reqData = null

    if (reqFirstParams === "request") {
      reqData = json.request
      reqFirstParams = Object.keys(reqData)[0]
    } else {
      reqData = json
    }

    return await this.router[reqFirstParams](ws, reqData)
  }

  async processMessageOrError(ws, message) {
    let responseData
    let json
    try {
      json = this.#parseMessage(message)
      updateStoreContext("rId", json?.request?.id ?? json?.message?.id ?? json?.system_message?.id ?? json?.id ?? "no-id")
      responseData = await this.#processMessage(ws, json)
      if (!responseData) {
        return new Response()
      }
    } catch (error) {
      logger.error(error)
      let errorBackMessage = null
      if (json.request) {
        errorBackMessage = {
          response: {
            id: json.request.id,
            error: error.cause || error.message,
          },
        }
      } else {
        const topLevelElement = Object.keys(json)[0]
        errorBackMessage = {
          [topLevelElement]: {
            id: json[topLevelElement].id,
            error: error.cause || error.message,
          },
        }
      }

      responseData = new Response().addBackMessage(errorBackMessage)
    }

    return responseData
  }
}

export default new PacketJsonProcessor()
