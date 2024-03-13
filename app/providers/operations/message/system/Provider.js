import RegisterProvider from '../../../../common/RegisterProvider.js'
import MessageSendSystemOperation from './index.js'

const name = 'MessageSendSystemOperation'

class MessageSendSystemOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use('SessionService')
    const userService = slc.use('UserService')
    const conversationService = slc.use('ConversationService')

    return new MessageSendSystemOperation(
      sessionService,
      userService,
      conversationService
    )
  }
}

export default new MessageSendSystemOperationRegisterProvider({ name, implementationName: MessageSendSystemOperation.name })