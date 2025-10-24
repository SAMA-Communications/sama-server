import RegisterProvider from "../../../../common/RegisterProvider.js"
import ConversationHandlerGetOperation from "./index.js"

const name = "ConversationHandlerGetOperation"

class ConversationHandlerGetOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const conversationService = slc.use("ConversationService")
    const conversationHandlerService = slc.use("ConversationHandlerService")

    return new ConversationHandlerGetOperation(sessionService, conversationService, conversationHandlerService)
  }
}

export default new ConversationHandlerGetOperationRegisterProvider({
  name,
  implementationName: ConversationHandlerGetOperation.name,
})
