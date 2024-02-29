import RegisterProvider from '../../../common/RegisterProvider.js'
import ConversationNotificationService from './index.js'

const name = 'ConversationNotificationService'

class ConversationNotificationServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const helpers = slc.use('Helpers')
    const messageService = slc.use('MessageService')
    const messageMapper = slc.use('MessageMapper')

    return new ConversationNotificationService(
      helpers,
      messageService,
      messageMapper
    )
  }
}

export default new ConversationNotificationServiceRegisterProvider({ name, implementationName: ConversationNotificationService.name })