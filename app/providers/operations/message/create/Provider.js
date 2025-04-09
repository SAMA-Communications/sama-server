import RegisterProvider from "../../../../common/RegisterProvider.js"
import MessageCreateOperation from "./index.js"

const name = "MessageCreateOperation"

class MessageCreateOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const storageService = slc.use("StorageDriverClient")
    const blockListService = slc.use("BlockListService")
    const userService = slc.use("UserService")
    const conversationService = slc.use("ConversationService")
    const conversationSchemeService = slc.use("ConversationSchemeService")
    const conversationNotificationService = slc.use("ConversationNotificationService")
    const messageService = slc.use("MessageService")

    return new MessageCreateOperation(
      sessionService,
      storageService,
      blockListService,
      userService,
      conversationService,
      conversationSchemeService,
      conversationNotificationService,
      messageService
    )
  }
}

export default new MessageCreateOperationRegisterProvider({ name, implementationName: MessageCreateOperation.name })
