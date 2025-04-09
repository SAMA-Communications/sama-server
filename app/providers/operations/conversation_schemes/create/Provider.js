import RegisterProvider from "../../../../common/RegisterProvider.js"
import ConversationSchemeCreateOperation from "./index.js"

const name = "ConversationSchemeCreateOperation"

class ConversationShemeCreateOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const conversationService = slc.use("ConversationService")
    const conversationSchemeService = slc.use("ConversationSchemeService")

    return new ConversationSchemeCreateOperation(sessionService, conversationService, conversationSchemeService)
  }
}

export default new ConversationShemeCreateOperationRegisterProvider({
  name,
  implementationName: ConversationSchemeCreateOperation.name,
})
