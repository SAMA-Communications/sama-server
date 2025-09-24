import RegisterProvider from "../../../../common/RegisterProvider.js"
import MessageToneOperation from "./index.js"

const name = "MessageToneOperation"

class MessageToneOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const messageService = slc.use("MessageService")

    return new MessageToneOperation(messageService)
  }
}

export default new MessageToneOperationRegisterProvider({ name, implementationName: MessageToneOperation.name })
