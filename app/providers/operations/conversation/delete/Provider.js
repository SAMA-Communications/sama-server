import RegisterProvider from "../../../../common/RegisterProvider.js"
import ConversationDeleteOperation from "./index.js"

const name = "ConversationDeleteOperation"

class ConversationDeleteOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const conversationService = slc.use("ConversationService")

    return new ConversationDeleteOperation(sessionService, conversationService)
  }
}

export default new ConversationDeleteOperationRegisterProvider({
  name,
  implementationName: ConversationDeleteOperation.name,
})
