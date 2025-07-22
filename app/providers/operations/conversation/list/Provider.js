import RegisterProvider from "../../../../common/RegisterProvider.js"
import ConversationListOperation from "./index.js"

const name = "ConversationListOperation"

class ConversationListOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")
    const conversationService = slc.use("ConversationService")
    const messageService = slc.use("MessageService")

    return new ConversationListOperation(sessionService, userService, messageService, conversationService)
  }
}

export default new ConversationListOperationRegisterProvider({
  name,
  implementationName: ConversationListOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
