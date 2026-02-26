import RegisterProvider from "../../../../common/RegisterProvider.js"
import MessageReactionsUpdateOperation from "./index.js"

const name = "MessageReactionsUpdateOperation"

class MessageReactionsUpdateOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const config = slc.use("Config")
    const sessionService = slc.use("SessionService")
    const messageService = slc.use("MessageService")
    const conversationService = slc.use("ConversationService")

    return new MessageReactionsUpdateOperation(config, sessionService, messageService, conversationService)
  }
}

export default new MessageReactionsUpdateOperationRegisterProvider({
  name,
  implementationName: MessageReactionsUpdateOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
