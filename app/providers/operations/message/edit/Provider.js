import RegisterProvider from "../../../../common/RegisterProvider.js"
import MessageEditOperation from "./index.js"

const name = "MessageEditOperation"

class MessageEditOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const messageService = slc.use("MessageService")
    const conversationService = slc.use("ConversationService")

    return new MessageEditOperation(sessionService, messageService, conversationService)
  }
}

export default new MessageEditOperationRegisterProvider({ name, implementationName: MessageEditOperation.name })
