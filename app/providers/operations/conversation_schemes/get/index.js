import { ERROR_STATUES } from "../../../../constants/errors.js"

class ConversationSchemeGetOperation {
  constructor(sessionService, conversationService, conversationSchemeService) {
    this.sessionService = sessionService
    this.conversationService = conversationService
    this.conversationSchemeService = conversationSchemeService
  }

  async perform(ws, schemeGetOptions) {
    const { cid } = schemeGetOptions
    const currentUserId = this.sessionService.getSessionUserId(ws)

    await this.#hasAccess(cid, currentUserId)

    const conversationScheme = await this.conversationSchemeService.getSchemeByConversationId(cid)
    if (!conversationScheme) {
      throw new Error(ERROR_STATUES.SCHEME_NOT_FOUND.message, {
        cause: ERROR_STATUES.SCHEME_NOT_FOUND,
      })
    }
    const { scheme, updated_by, updated_at } = conversationScheme

    return { scheme, updated_by, updated_at }
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

export default ConversationSchemeGetOperation
