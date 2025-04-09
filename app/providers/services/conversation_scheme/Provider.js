import RegisterProvider from "../../../common/RegisterProvider.js"
import ConversationSchemeService from "./index.js"

const name = "ConversationSchemeService"

class ConversationSchemeServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const conversationSchemeRepo = slc.use("ConversationSchemeRepository")

    return new ConversationSchemeService(conversationSchemeRepo)
  }
}

export default new ConversationSchemeServiceRegisterProvider({
  name,
  implementationName: ConversationSchemeService.name,
})
