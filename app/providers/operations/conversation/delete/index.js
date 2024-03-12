import { ERROR_STATUES } from '../../../../constants/errors.js'

class ConversationDeleteOperation {
  constructor(
    sessionService,
    conversationService
  ) {
    this.sessionService = sessionService
    this.conversationService = conversationService
  }

  async perform(ws, conversationId) {
    const currentUserId = this.sessionService.getSessionUserId(ws)

    const { conversation, participantIds } = await this.#hasAccess(conversationId, currentUserId)

    await this.conversationService.removeParticipants(conversation, [currentUserId], participantIds)
  }

  async #hasAccess(conversationId, userId) {
    const { conversation, asParticipant, participantIds } = await this.conversationService.hashAccessToConversation(conversationId, userId)
    if (!conversation) {
      throw new Error(ERROR_STATUES.BAD_REQUEST.message, {
        cause: ERROR_STATUES.BAD_REQUEST,
      })
    }

    if (!asParticipant) {
      throw new Error(ERROR_STATUES.PARTICIPANT_NOT_FOUND.message, {
        cause: ERROR_STATUES.PARTICIPANT_NOT_FOUND,
      })
    }

    return { conversation, participantIds }
  }
}

export default ConversationDeleteOperation
