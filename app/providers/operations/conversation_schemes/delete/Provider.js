import RegisterProvider from "../../../../common/RegisterProvider.js"
import ConversationSchemeDeleteOperation from "./index.js"

const name = "ConversationSchemeDeleteOperation"

class ConversationShemeDeleteOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const conversationService = slc.use("ConversationService")
    const conversationSchemeService = slc.use("ConversationSchemeService")

    return new ConversationSchemeDeleteOperation(sessionService, conversationService, conversationSchemeService)
  }
}

export default new ConversationShemeDeleteOperationRegisterProvider({
  name,
  implementationName: ConversationSchemeDeleteOperation.name,
})
