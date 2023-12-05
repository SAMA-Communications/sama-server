import BaseAPI from "@sama/common/API.js"
import packetJsonProcessor from "./routes/packet_processor.js"
import { detectJsonMessage } from "./utils/detect_message.js"

export default class JsonAPI extends BaseAPI {
  detectMessage (ws, message) {
    return detectJsonMessage(message)
  }

  async onMessage(ws, message) {
    const responseData = await packetJsonProcessor.processMessageOrError(ws, message)
    if (responseData) {
      return JSON.stringify(responseData)
    }
  }

  buildLastActivityPackage(userId, timestamp, status) {
    const message = { last_activity: { [userId]: status || timestamp } }
    return JSON.stringify(message)
  }
}