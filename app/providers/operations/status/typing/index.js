import { ERROR_STATUES } from "../../../../constants/errors.js"

class StatusTypingOperation {
  constructor(sessionService, conversationService) {
    this.sessionService = sessionService
    this.conversationService = conversationService
  }

  async perform(ws, statusTypingParams) {
    const { cid: conversationId, status } = statusTypingParams
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const { conversation, participantIds } = await this.#hasAccess(organizationId, conversationId, currentUserId)

    const currentTs = parseInt(Math.round(Date.now() / 1000))

    const typingStatus = {
      typing: {
        cid: conversationId,
        c_type: conversation.type,
        from: currentUserId,
        t: currentTs,
        status,
      },
    }

    return { status: typingStatus, participantIds }
  }

  async #hasAccess(organizationId, conversationId, currentUserId) {
    const { conversation, asParticipant, participantIds } = await this.conversationService.hasAccessToConversation(
      organizationId,
      conversationId,
      currentUserId
    )

    if (!conversation) {
      throw new Error(ERROR_STATUES.CONVERSATION_NOT_FOUND.message, {
        cause: ERROR_STATUES.CONVERSATION_NOT_FOUND,
      })
    }

    if (!asParticipant) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }

    return { conversation, participantIds }
  }
}

export default StatusTypingOperation
