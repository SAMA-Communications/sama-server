import RegisterProvider from "../../../../common/RegisterProvider.js"
import ConversationSearchOperation from "./index.js"

const name = "ConversationSearchOperation"

class ConversationSearchOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const conversationService = slc.use("ConversationService")

    return new ConversationSearchOperation(sessionService, conversationService)
  }
}

export default new ConversationSearchOperationRegisterProvider({
  name,
  implementationName: ConversationSearchOperation.name,
})
