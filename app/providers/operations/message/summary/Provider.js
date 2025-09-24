import RegisterProvider from "../../../../common/RegisterProvider.js"
import MessageSummaryOperation from "./index.js"

const name = "MessageSummaryOperation"

class MessageSummaryOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const helpers = slc.use("Helpers")
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")
    const messageService = slc.use("MessageService")
    const conversationService = slc.use("ConversationService")

    return new MessageSummaryOperation(helpers, sessionService, userService, messageService, conversationService)
  }
}

export default new MessageSummaryOperationRegisterProvider({ name, implementationName: MessageSummaryOperation.name })
