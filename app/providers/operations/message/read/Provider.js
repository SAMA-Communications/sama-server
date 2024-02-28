import RegisterProvider from '../../../../common/RegisterProvider.js'
import MessageReadOperation from './index.js'

const name = 'MessageReadOperation'

class MessageReadOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use('SessionService')
    const messageService = slc.use('MessageService')
    const conversationService = slc.use('ConversationService')

    return new MessageReadOperation(
      sessionService,
      messageService,
      conversationService
    )
  }
}

export default new MessageReadOperationRegisterProvider({ name, implementationName: MessageReadOperation.name })