import RegisterProvider from '../../../../common/RegisterProvider.js'
import ConversationEditOperation from './index.js'

const name = 'ConversationEditOperation'

class ConversationEditOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use('SessionService')
    const userService = slc.use('UserService')
    const conversationService = slc.use('ConversationService')
    const conversationNotificationService = slc.use('ConversationNotificationService')

    return new ConversationEditOperation(
      sessionService,
      userService,
      conversationService,
      conversationNotificationService
    )
  }
}

export default new ConversationEditOperationRegisterProvider({ name, implementationName: ConversationEditOperation.name })