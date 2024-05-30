import RegisterProvider from "../../../../common/RegisterProvider.js"
import MessageDeleteOperation from "./index.js"

const name = "MessageDeleteOperation"

class MessageDeleteOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const conversationService = slc.use("ConversationService")
    const messageService = slc.use("MessageService")

    return new MessageDeleteOperation(sessionService, conversationService, messageService)
  }
}

export default new MessageDeleteOperationRegisterProvider({ name, implementationName: MessageDeleteOperation.name })
