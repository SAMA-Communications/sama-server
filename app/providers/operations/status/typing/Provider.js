import RegisterProvider from "../../../../common/RegisterProvider.js"
import StatusTypingOperation from "./index.js"

const name = "StatusTypingOperation"

class StatusTypingOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const conversationService = slc.use("ConversationService")

    return new StatusTypingOperation(sessionService, conversationService)
  }
}

export default new StatusTypingOperationRegisterProvider({ name, implementationName: StatusTypingOperation.name })
