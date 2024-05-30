import RegisterProvider from "../../../common/RegisterProvider.js"
import ConversationNotificationService from "./index.js"

const name = "ConversationNotificationService"

class ConversationNotificationServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const helpers = slc.use("Helpers")
    const messageService = slc.use("MessageService")

    return new ConversationNotificationService(helpers, messageService)
  }
}

export default new ConversationNotificationServiceRegisterProvider({
  name,
  implementationName: ConversationNotificationService.name,
})
