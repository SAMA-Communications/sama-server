import RegisterProvider from '../../../../common/RegisterProvider.js'
import ConversationCreateOperation from './index.js'

const name = 'ConversationCreateOperation'

class ConversationCreateOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use('SessionService')
    const userService = slc.use('UserService')
    const conversationService = slc.use('ConversationService')
    const conversationNotificationService = slc.use('ConversationNotificationService')
    const conversationMapper = slc.use('ConversationMapper')

    return new ConversationCreateOperation(
      sessionService,
      userService,
      conversationService,
      conversationNotificationService,
      conversationMapper
    )
  }
}

export default new ConversationCreateOperationRegisterProvider({ name, implementationName: ConversationCreateOperation.name })