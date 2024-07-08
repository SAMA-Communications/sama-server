import RegisterProvider from "../../../../common/RegisterProvider.js"
import ConversationDeleteOperation from "./index.js"

const name = "ConversationDeleteOperation"

class ConversationDeleteOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const helpers = slc.use("Helpers")
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")
    const conversationService = slc.use("ConversationService")
    const conversationNotificationService = slc.use("ConversationNotificationService")

    return new ConversationDeleteOperation(
      helpers,
      sessionService,
      userService,
      conversationService,
      conversationNotificationService
    )
  }
}

export default new ConversationDeleteOperationRegisterProvider({
  name,
  implementationName: ConversationDeleteOperation.name,
})
