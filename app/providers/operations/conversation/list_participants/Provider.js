import RegisterProvider from '../../../../common/RegisterProvider.js'
import ConversationListParticipantsOperation from './index.js'

const name = 'ConversationListParticipantsOperation'

class ConversationListParticipantsOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use('SessionService')
    const userService = slc.use('UserService')
    const conversationService = slc.use('ConversationService')
    const userMapper = slc.use('UserMapper')
    const conversationMapper = slc.use('ConversationMapper')

    return new ConversationListParticipantsOperation(
      sessionService,
      userService,
      conversationService,
      userMapper,
      conversationMapper
    )
  }
}

export default new ConversationListParticipantsOperationRegisterProvider({ name, implementationName: ConversationListParticipantsOperation.name })