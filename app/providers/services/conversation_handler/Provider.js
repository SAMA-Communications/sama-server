import RegisterProvider from "../../../common/RegisterProvider.js"
import ConversationHandlerService from "./index.js"

const name = "ConversationHandlerService"

class ConversationHandlerServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const conversationHandlerRepo = slc.use("ConversationHandlerRepository")

    return new ConversationHandlerService(conversationHandlerRepo)
  }
}

export default new ConversationHandlerServiceRegisterProvider({
  name,
  implementationName: ConversationHandlerService.name,
})
