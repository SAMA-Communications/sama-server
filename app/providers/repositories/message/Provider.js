import RegisterProvider from "../../../common/RegisterProvider.js"
import Message from "../../../models/message.js"
import MessageRepository from "./index.js"

const name = "MessageRepository"

class MessageRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use("MongoConnection")
    const messageMapper = slc.use("MessageMapper")

    return new MessageRepository(mongoConnection, Message, messageMapper)
  }
}

export default new MessageRepositoryRegisterProvider({ name, implementationName: MessageRepository.name })
