import RegisterProvider from "../../../../common/RegisterProvider.js"
import ConversationSearchOperation from "./index.js"

const name = "ConversationSearchOperation"

class ConversationSearchOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const config = slc.use("Config")
    const sessionService = slc.use("SessionService")
    const conversationService = slc.use("ConversationService")

    return new ConversationSearchOperation(config, sessionService, conversationService)
  }
}

export default new ConversationSearchOperationRegisterProvider({
  name,
  implementationName: ConversationSearchOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
