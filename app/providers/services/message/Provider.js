import RegisterProvider from "../../../common/RegisterProvider.js"
import MessageService from "./index.js"

const name = "MessageService"

class MessageServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const helpers = slc.use("Helpers")
    const userRepo = slc.use("UserRepository")
    const messageRepo = slc.use("MessageRepository")
    const messageStatusRepo = slc.use("MessageStatusRepository")

    return new MessageService(helpers, userRepo, messageRepo, messageStatusRepo)
  }
}

export default new MessageServiceRegisterProvider({ name, implementationName: MessageService.name })
