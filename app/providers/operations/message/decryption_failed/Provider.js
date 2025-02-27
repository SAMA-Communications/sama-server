import RegisterProvider from "../../../../common/RegisterProvider.js"
import MessageDecryptionFailedOperation from "./index.js"

const name = "MessageDecryptionFailedOperation"

class MessageDecryptionFailedOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")
    const messageService = slc.use("MessageService")
    const conversationService = slc.use("ConversationService")

    return new MessageDecryptionFailedOperation(sessionService, userService, messageService, conversationService)
  }
}

export default new MessageDecryptionFailedOperationRegisterProvider({
  name,
  implementationName: MessageDecryptionFailedOperation.name,
})
