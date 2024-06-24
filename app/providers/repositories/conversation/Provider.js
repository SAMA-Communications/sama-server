import RegisterProvider from "../../../common/RegisterProvider.js"
import Conversation from "../../../new_models/conversation.js"
import ConversationRepository from "./index.js"

const name = "ConversationRepository"

class ConversationRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use("MongoConnection")
    const conversationMapper = slc.use("ConversationMapper")

    return new ConversationRepository(mongoConnection, Conversation, conversationMapper)
  }
}

export default new ConversationRepositoryRegisterProvider({ name, implementationName: ConversationRepository.name })
