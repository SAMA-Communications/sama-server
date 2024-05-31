import RegisterProvider from "../../../common/RegisterProvider.js"
import ConversationParticipant from "../../../new_models/conversation_participants.js"
import ConversationParticipantRepository from "./index.js"

const name = "ConversationParticipantRepository"

class ConversationParticipantRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use("MongoConnection")
    const baseMapper = slc.use("BaseMapper")

    return new ConversationParticipantRepository(mongoConnection, ConversationParticipant, baseMapper)
  }
}

export default new ConversationParticipantRepositoryRegisterProvider({
  name,
  implementationName: ConversationParticipantRepository.name,
})
