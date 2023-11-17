import BasePacketProcessor from "../../../app/common/packet_processor.js"
import { routes } from "./routes.js"

class PacketJsonProcessor extends BasePacketProcessor {
  constructor() {
    super()
    this.router = routes;
  }

  #parseMessage(message) {
    return JSON.parse(message)
  }

  async #processMessage(ws, json) {

    let reqFirstParams = Object.keys(json)[0];
    let reqData = null;

    if (reqFirstParams === "request") {
      reqData = json.request;
      reqFirstParams = Object.keys(reqData)[0];
    } else {
      reqData = json;
    }

    return this.router[reqFirstParams](ws, reqData);
  }

  async processMessageOrError(ws, message) {
    let responseData;
    let json;
    try {
      json = this.#parseMessage(message)
      responseData = await this.#processMessage(ws, json);
    } catch (e) {
      console.error(e)
      if (json.request) {
        responseData = {
          response: {
            id: json.request.id,
            error: e.cause,
          },
        };
      } else {
        const topLevelElement = Object.keys(json)[0];
        responseData = {
          [topLevelElement]: {
            id: json[topLevelElement].id,
            error: e.cause,
          },
        };
      }
    }

    return responseData;
  }
}

export default new PacketJsonProcessor();
