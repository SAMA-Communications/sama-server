import RegisterProvider from '../../../common/RegisterProvider.js'
import Message from '../../../new_models/message.js'
import MessageRepository from './index.js'

const name = 'MessageRepository'

class MessageRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use('MongoConnection')

    return new MessageRepository(mongoConnection, Message)
  }
}

export default new MessageRepositoryRegisterProvider({ name, implementationName: MessageRepository.name })