import { ERROR_STATUES } from "../../../../constants/errors.js"

class ConversationSchemeDeleteOperation {
  constructor(sessionService, conversationService, conversationSchemeService) {
    this.sessionService = sessionService
    this.conversationService = conversationService
    this.conversationSchemeService = conversationSchemeService
  }

  async perform(ws, schemeParams) {
    const { cid } = schemeParams
    const currentUserId = this.sessionService.getSessionUserId(ws)

    await this.#hasAccess(cid, currentUserId)

    const existedSchemeForConversation = await this.conversationSchemeService.getSchemeByConversationId(cid)
    if (!existedSchemeForConversation) {
      throw new Error(ERROR_STATUES.SCHEME_NOT_FOUND.message, {
        cause: ERROR_STATUES.SCHEME_NOT_FOUND,
      })
    }
    await this.conversationSchemeService.deleteConversationScheme(existedSchemeForConversation._id)
  }

  async #hasAccess(conversationId, userId) {
    const { conversation, asOwner } = await this.conversationService.hasAccessToConversation(conversationId, userId)

    if (!conversation) {
      throw new Error(ERROR_STATUES.BAD_REQUEST.message, {
        cause: ERROR_STATUES.BAD_REQUEST,
      })
    }

    if (!asOwner) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }
  }
}

export default ConversationSchemeDeleteOperation
