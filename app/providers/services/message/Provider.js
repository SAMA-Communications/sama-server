import RegisterProvider from "../../../common/RegisterProvider.js"
import MessageService from "./index.js"

const name = "MessageService"

class MessageServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const config = slc.use("Config")
    const helpers = slc.use("Helpers")
    const userRepo = slc.use("UserRepository")
    const messageRepo = slc.use("MessageRepository")
    const messageStatusRepo = slc.use("MessageStatusRepository")
    const messageReactionRepo = slc.use("MessageReactionRepository")
    const encryptionRepo = slc.use("EncryptionRepository")
    const encryptedMessageStatusRepo = slc.use("EncryptedMessageStatusRepository")

    return new MessageService(
      config,
      helpers,
      userRepo,
      messageRepo,
      messageStatusRepo,
      messageReactionRepo,
      encryptionRepo,
      encryptedMessageStatusRepo
    )
  }
}

export default new MessageServiceRegisterProvider({ name, implementationName: MessageService.name })
