import BaseAPI from "@sama/common/API.js"

import { CONSTANTS as MAIN_CONSTANTS } from "@sama/constants/constants.js"

import packetJsonProcessor from "./routes/packet_processor.js"
import { detectJsonMessage } from "./utils/detect_message.js"

export default class JsonAPI extends BaseAPI {
  detectMessage(ws, message) {
    return detectJsonMessage(message)
  }

  stringifyMessage(message) {
    return JSON.stringify(message)
  }

  stringifyResponse(response) {
    response.backMessages = response.backMessages.map((backMessage) => this.stringifyMessage(backMessage))
    response.deliverMessages = response.deliverMessages.map((deliverMessage) =>
      Object.assign(deliverMessage, { packet: this.stringifyMessage(deliverMessage.packet) })
    )
    return response
  }

  async onMessage(ws, message) {
    const responseData = await packetJsonProcessor.processMessageOrError(ws, message)
    return this.stringifyResponse(responseData)
  }

  buildLastActivityPackage(recipientUserId, targetUserId, activityStatus) {
    const message = {
      last_activity: {
        [targetUserId]: activityStatus.status === MAIN_CONSTANTS.LAST_ACTIVITY_STATUS.ONLINE ? 0 : activityStatus.timestamp,
      },
    }
    return this.stringifyMessage(message)
  }
}
