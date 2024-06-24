import RegisterProvider from "../../../../common/RegisterProvider.js"
import ConversationSearchOperation from "./index.js"

const name = "ConversationSearchOperation"

class ConversationSearchOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const conversationService = slc.use("ConversationService")

    return new ConversationSearchOperation(conversationService)
  }
}

export default new ConversationSearchOperationRegisterProvider({
  name,
  implementationName: ConversationSearchOperation.name,
})
