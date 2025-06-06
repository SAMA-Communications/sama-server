import RegisterProvider from "../../../../common/RegisterProvider.js"
import ConversationSubscribeUnsubscribeOperation from "./index.js"

const name = "ConversationSubscribeUnsubscribeOperation"

class ConversationSubscribeUnsubscribeOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const helpers = slc.use("Helpers")
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")
    const conversationService = slc.use("ConversationService")

    return new ConversationSubscribeUnsubscribeOperation(helpers, sessionService, userService, conversationService)
  }
}

export default new ConversationSubscribeUnsubscribeOperationRegisterProvider({
  name,
  implementationName: ConversationSubscribeUnsubscribeOperation.name,
})
