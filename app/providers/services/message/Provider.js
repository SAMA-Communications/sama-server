import RegisterProvider from "../../../common/RegisterProvider.js"
import MessageService from "./index.js"

const name = "MessageService"

class MessageServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const messageRepo = slc.use("MessageRepository")
    const messageStatusRepo = slc.use("MessageStatusRepository")

    return new MessageService(messageRepo, messageStatusRepo)
  }
}

export default new MessageServiceRegisterProvider({ name, implementationName: MessageService.name })
