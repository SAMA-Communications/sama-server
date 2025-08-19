import RegisterProvider from "../../../common/RegisterProvider.js"
import ConversationHandlerService from "./index.js"

const name = "ConversationHandlerService"

class ConversationHandlerServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const logger = slc.use("Logger")
    const conversationHandlerRepo = slc.use("ConversationHandlerRepository")

    return new ConversationHandlerService(logger, conversationHandlerRepo)
  }
}

export default new ConversationHandlerServiceRegisterProvider({
  name,
  implementationName: ConversationHandlerService.name,
})
