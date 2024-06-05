import RegisterProvider from '../../../common/RegisterProvider.js'
import ConversationService from './index.js'

const name = 'ConversationService'

class ConversationServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const CONVERSATION_MAX_PARTICIPANTS = process.env.CONVERSATION_MAX_PARTICIPANTS

    const conversationRepo = slc.use('ConversationRepository')
    const conversationParticipantRepo = slc.use('ConversationParticipantRepository')

    return new ConversationService(
      CONVERSATION_MAX_PARTICIPANTS,

      conversationRepo,
      conversationParticipantRepo
    )
  }
}

export default new ConversationServiceRegisterProvider({ name, implementationName: ConversationService.name })