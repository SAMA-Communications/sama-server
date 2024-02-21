import { ERROR_STATUES } from '../../../../constants/errors.js'

class ConversationUpdateOperation {
  constructor(
    sessionService,
    userService,
    conversationService,
    conversationMapper
  ) {
    this.sessionService = sessionService
    this.userService = userService
    this.conversationService = conversationService
    this.conversationMapper = conversationMapper
  }

  async perform(ws, conversationParams) {
    const currentUserId = this.sessionService.getSessionUserId(ws)
    
  }
}

export default ConversationUpdateOperation
