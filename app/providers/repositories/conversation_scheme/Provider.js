import RegisterProvider from "../../../common/RegisterProvider.js"
import ConversationScheme from "../../../models/conversation_scheme.js"
import ConversationSchemeRepository from "./index.js"

const name = "ConversationSchemeRepository"

class ConversationSchemeRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use("MongoConnection")
    const baseMapper = slc.use("BaseMapper")

    return new ConversationSchemeRepository(mongoConnection, ConversationScheme, baseMapper)
  }
}

export default new ConversationSchemeRepositoryRegisterProvider({
  name,
  implementationName: ConversationSchemeRepository.name,
})
