import { ERROR_STATUES } from "../../../../constants/errors.js"

class StatusTypingOperation {
  constructor(sessionService, conversationService) {
    this.sessionService = sessionService
    this.conversationService = conversationService
  }

  async perform(ws, statusTypingParams) {
    const { cid: conversationId, type } = statusTypingParams
    const currentUserId = this.sessionService.getSessionUserId(ws)

    const participantIds = await this.#hasAccess(conversationId, currentUserId)

    const currentTs = parseInt(Math.round(Date.now() / 1000))

    const status = {
      cid: conversationId,
      from: conversationId,
      t: currentTs,
      type,
    }

    return { status, participantIds }
  }

  async #hasAccess(conversationId, currentUserId) {
    const { conversation, asParticipant, participantIds } = await this.conversationService.hasAccessToConversation(
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

    return participantIds
  }
}

export default StatusTypingOperation
