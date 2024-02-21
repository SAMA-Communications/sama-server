import RegisterProvider from '../../../common/RegisterProvider.js'
import Conversation from '../../../new_models/conversation.js'
import ConversationRepository from './index.js'

const name = 'ConversationRepository'

class ConversationRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use('MongoConnection')

    return new ConversationRepository(mongoConnection, Conversation)
  }
}

export default new ConversationRepositoryRegisterProvider({ name, implementationName: ConversationRepository.name })