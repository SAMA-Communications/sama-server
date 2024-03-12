import RegisterProvider from '../../../common/RegisterProvider.js'
import MessageStatus from '../../../new_models/message_status.js'
import MessageStatusRepository from './index.js'

const name = 'MessageStatusRepository'

class MessageStatusRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use('MongoConnection')
    const baseMapper = slc.use('BaseMapper')

    return new MessageStatusRepository(mongoConnection, MessageStatus, baseMapper)
  }
}

export default new MessageStatusRepositoryRegisterProvider({ name, implementationName: MessageStatusRepository.name })