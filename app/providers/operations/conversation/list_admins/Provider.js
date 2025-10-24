import RegisterProvider from "../../../../common/RegisterProvider.js"
import ConversationListAdminsOperation from "./index.js"

const name = "ConversationListAdminsOperation"

class ConversationListAdminsOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")
    const conversationService = slc.use("ConversationService")

    return new ConversationListAdminsOperation(sessionService, userService, conversationService)
  }
}

export default new ConversationListAdminsOperationRegisterProvider({
  name,
  implementationName: ConversationListAdminsOperation.name,
})
