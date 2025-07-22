import RegisterProvider from "../../../../common/RegisterProvider.js"
import MessageReactionsListOperation from "./index.js"

const name = "MessageReactionsListOperation"

class MessageReactionsListOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const messageService = slc.use("MessageService")

    return new MessageReactionsListOperation(sessionService, messageService)
  }
}

export default new MessageReactionsListOperationRegisterProvider({
  name,
  implementationName: MessageReactionsListOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
