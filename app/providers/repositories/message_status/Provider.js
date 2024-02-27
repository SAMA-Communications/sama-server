import RegisterProvider from '../../../common/RegisterProvider.js'
import MessageStatus from '../../../new_models/message.js'
import MessageStatusRepository from './index.js'

const name = 'MessageStatusRepository'

class MessageStatusRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use('MongoConnection')

    return new MessageStatusRepository(mongoConnection, MessageStatus)
  }
}

export default new MessageStatusRepositoryRegisterProvider({ name, implementationName: MessageStatusRepository.name })