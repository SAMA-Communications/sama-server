import RegisterProvider from "../../../../common/RegisterProvider.js"
import MessageCreateOperation from "./index.js"

const name = "MessageCreateOperation"

class MessageCreateOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const config = slc.use("Config")
    const sessionService = slc.use("SessionService")
    const storageService = slc.use("StorageDriverClient")
    const blockListService = slc.use("BlockListService")
    const userService = slc.use("UserService")
    const conversationService = slc.use("ConversationService")
    const conversationHandlerService = slc.use("ConversationHandlerService")
    const conversationNotificationService = slc.use("ConversationNotificationService")
    const messageService = slc.use("MessageService")

    return new MessageCreateOperation(
      config,
      sessionService,
      storageService,
      blockListService,
      userService,
      conversationService,
      conversationHandlerService,
      conversationNotificationService,
      messageService
    )
  }
}

export default new MessageCreateOperationRegisterProvider({
  name,
  implementationName: MessageCreateOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
