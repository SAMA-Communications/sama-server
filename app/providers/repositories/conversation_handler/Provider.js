import RegisterProvider from "../../../common/RegisterProvider.js"
import ConversationHandler from "../../../models/conversation_handlers.js"
import ConversationHandlerRepository from "./index.js"

const name = "ConversationHandlerRepository"

class ConversationHandlerRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use("MongoConnection")
    const baseMapper = slc.use("BaseMapper")

    return new ConversationHandlerRepository(mongoConnection, ConversationHandler, baseMapper)
  }
}

export default new ConversationHandlerRepositoryRegisterProvider({
  name,
  implementationName: ConversationHandlerRepository.name,
})
