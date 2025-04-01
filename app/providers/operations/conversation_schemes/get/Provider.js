import RegisterProvider from "../../../../common/RegisterProvider.js"
import ConversationSchemeGetOperation from "./index.js"

const name = "ConversationSchemeGetOperation"

class ConversationShemeGetOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const conversationService = slc.use("ConversationService")
    const conversationSchemeService = slc.use("ConversationSchemeService")

    return new ConversationSchemeGetOperation(sessionService, conversationService, conversationSchemeService)
  }
}

export default new ConversationShemeGetOperationRegisterProvider({
  name,
  implementationName: ConversationSchemeGetOperation.name,
})
