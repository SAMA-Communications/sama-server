import RegisterProvider from '../../../../common/RegisterProvider.js'
import MessageSendSystemOperation from './index.js'

const name = 'MessageSendSystemOperation'

class MessageSendSystemOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use('SessionService')
    const userService = slc.use('UserService')
    const conversationService = slc.use('ConversationService')
    const messageService = slc.use('MessageService')

    return new MessageSendSystemOperation(
      sessionService,
      userService,
      conversationService,
      messageService
    )
  }
}

export default new MessageSendSystemOperationRegisterProvider({ name, implementationName: MessageSendSystemOperation.name })