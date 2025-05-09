import RegisterProvider from "../../../common/RegisterProvider.js"
import MessageReaction from "../../../models/message_reaction.js"
import MessageReactionRepository from "./index.js"

const name = "MessageReactionRepository"

class MessageReactionRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use("MongoConnection")
    const baseMapper = slc.use("BaseMapper")

    return new MessageReactionRepository(mongoConnection, MessageReaction, baseMapper)
  }
}

export default new MessageReactionRepositoryRegisterProvider({
  name,
  implementationName: MessageReactionRepository.name,
})
