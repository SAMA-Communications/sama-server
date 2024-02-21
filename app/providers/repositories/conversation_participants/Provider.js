import RegisterProvider from '../../../common/RegisterProvider.js'
import ConversationParticipant from '../../../new_models/conversation_participants.js'
import ConversationParticipantRepository from './index.js'

const name = 'ConversationParticipantRepository'

class ConversationParticipantRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use('MongoConnection')

    return new ConversationParticipantRepository(mongoConnection, ConversationParticipant)
  }
}

export default new ConversationParticipantRepositoryRegisterProvider({ name, implementationName: ConversationParticipantRepository.name })