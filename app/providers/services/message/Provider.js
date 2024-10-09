import RegisterProvider from "../../../common/RegisterProvider.js"
import MessageService from "./index.js"

const name = "MessageService"

class MessageServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const helpers = slc.use("Helpers")
    const messageRepo = slc.use("MessageRepository")
    const messageStatusRepo = slc.use("MessageStatusRepository")
    const encryptionRepo = slc.use("EncryptionRepository")

    return new MessageService(helpers, messageRepo, messageStatusRepo, encryptionRepo)
  }
}

export default new MessageServiceRegisterProvider({ name, implementationName: MessageService.name })
