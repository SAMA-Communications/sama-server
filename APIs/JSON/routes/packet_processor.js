import { CONSTANTS as MAIN_CONSTANTS } from "@sama/constants/constants.js"
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
    let requestTrackId
    try {
      json = this.#parseMessage(message)
      requestTrackId = json?.request?.id ?? json?.message?.id ?? json?.system_message?.id ?? json?.id
      updateStoreContext(
        MAIN_CONSTANTS.LOGGER_BINDINGS_NAMES.REQUEST_ID,
        requestTrackId ?? MAIN_CONSTANTS.LOGGER_BINDINGS_NAMES.NO_REQUEST_ID
      )
      responseData = await this.#processMessage(ws, json)
      if (!responseData) {
        return new Response()
      }
    } catch (error) {
      logger.error(error)
      let errorBackMessage = null
      if (json?.request) {
        errorBackMessage = {
          response: {
            id: json.request?.id ?? requestTrackId,
            error: error.cause || error.message,
          },
        }
      } else {
        const topLevelElement = json ? Object.keys(json)[0] : void 0
        errorBackMessage = {
          [topLevelElement]: {
            id: json?.[topLevelElement]?.id ?? requestTrackId,
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
