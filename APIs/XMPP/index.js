import BaseAPI from "@sama/common/API.js"
import packetXmppProcessor from "./routes/packet_processor.js"
import { detectXMPPMessage } from "./utils/detect_message.js"

export default class XmppAPI extends BaseAPI {
  detectMessage (ws, message) {
    return detectXMPPMessage(message)
  }

  async onMessage(ws, message) {
    const responseData = await packetXmppProcessor.processMessageOrError(ws, message)
    return responseData?.toString()
  }
}