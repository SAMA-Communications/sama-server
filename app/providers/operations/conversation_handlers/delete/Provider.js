import RegisterProvider from "../../../../common/RegisterProvider.js"
import ConversationHandlerDeleteOperation from "./index.js"

const name = "ConversationHandlerDeleteOperation"

class ConversationHandlerDeleteOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const conversationService = slc.use("ConversationService")
    const conversationHandlerService = slc.use("ConversationHandlerService")

    return new ConversationHandlerDeleteOperation(sessionService, conversationService, conversationHandlerService)
  }
}

export default new ConversationHandlerDeleteOperationRegisterProvider({
  name,
  implementationName: ConversationHandlerDeleteOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
