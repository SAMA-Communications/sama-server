import RegisterProvider from "../../../../common/RegisterProvider.js"
import ConversationEditOperation from "./index.js"

const name = "ConversationEditOperation"

class ConversationEditOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const helpers = slc.use("Helpers")
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")
    const conversationService = slc.use("ConversationService")
    const messageService = slc.use("MessageService")
    const conversationNotificationService = slc.use("ConversationNotificationService")

    return new ConversationEditOperation(
      helpers,
      sessionService,
      userService,
      conversationService,
      conversationNotificationService,
      messageService
    )
  }
}

export default new ConversationEditOperationRegisterProvider({
  name,
  implementationName: ConversationEditOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
