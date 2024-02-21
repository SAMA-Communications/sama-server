import RegisterProvider from '../../../../common/RegisterProvider.js'
import ConversationUpdateOperation from './index.js'

const name = 'ConversationUpdateOperation'

class ConversationUpdateOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use('SessionService')
    const userService = slc.use('UserService')
    const conversationService = slc.use('ConversationService')
    const conversationMapper = slc.use('ConversationMapper')

    return new ConversationUpdateOperation(
      sessionService,
      userService,
      conversationService,
      conversationMapper
    )
  }
}

export default new ConversationUpdateOperationRegisterProvider({ name, implementationName: ConversationUpdateOperation.name })