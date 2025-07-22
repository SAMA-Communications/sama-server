import RegisterProvider from "../../../../common/RegisterProvider.js"
import ConversationHandlerCreateOperation from "./index.js"

const name = "ConversationHandlerCreateOperation"

class ConversationHandlerCreateOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const conversationService = slc.use("ConversationService")
    const conversationHandlerService = slc.use("ConversationHandlerService")

    return new ConversationHandlerCreateOperation(sessionService, conversationService, conversationHandlerService)
  }
}

export default new ConversationHandlerCreateOperationRegisterProvider({
  name,
  implementationName: ConversationHandlerCreateOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
