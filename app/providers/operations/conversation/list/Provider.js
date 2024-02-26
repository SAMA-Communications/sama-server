import RegisterProvider from '../../../../common/RegisterProvider.js'
import ConversationListOperation from './index.js'
import Message from '../../../../models/message.js'

const name = 'ConversationListOperation'

class ConversationListOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use('SessionService')
    const userService = slc.use('UserService')
    const conversationService = slc.use('ConversationService')
    const conversationMapper = slc.use('ConversationMapper')

    return new ConversationListOperation(
      sessionService,
      userService,
      Message,
      conversationService,
      conversationMapper
    )
  }
}

export default new ConversationListOperationRegisterProvider({ name, implementationName: ConversationListOperation.name })