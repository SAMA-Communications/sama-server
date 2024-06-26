import RegisterProvider from "../../../../common/RegisterProvider.js"
import MessageListOperation from "./index.js"

const name = "MessageListOperation"

class MessageListOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")
    const messageService = slc.use("MessageService")
    const conversationService = slc.use("ConversationService")

    return new MessageListOperation(sessionService, userService, messageService, conversationService)
  }
}

export default new MessageListOperationRegisterProvider({ name, implementationName: MessageListOperation.name })
