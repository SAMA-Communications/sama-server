import RegisterProvider from "../../../../common/RegisterProvider.js"
import MessageCreateOperation from "./index.js"
import blockListRepository from "../../../../repositories/blocklist_repository.js"

const name = "MessageCreateOperation"

class MessageCreateOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const storageService = slc.use("StorageDriverClient")
    const userService = slc.use("UserService")
    const conversationService = slc.use("ConversationService")
    const conversationNotificationService = slc.use("ConversationNotificationService")
    const messageService = slc.use("MessageService")

    return new MessageCreateOperation(
      sessionService,
      storageService,
      blockListRepository,
      userService,
      conversationService,
      conversationNotificationService,
      messageService
    )
  }
}

export default new MessageCreateOperationRegisterProvider({ name, implementationName: MessageCreateOperation.name })
