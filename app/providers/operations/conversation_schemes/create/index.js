import { ERROR_STATUES } from "../../../../constants/errors.js"

class ConversationSchemeCreateOperation {
  constructor(sessionService, conversationService, conversationSchemeService) {
    this.sessionService = sessionService
    this.conversationService = conversationService
    this.conversationSchemeService = conversationSchemeService
  }

  async perform(ws, schemeParams) {
    const { cid, scheme } = schemeParams
    const currentUserId = this.sessionService.getSessionUserId(ws)

    await this.#hasAccess(cid, currentUserId)

    const existedSchemeForConversation = await this.conversationSchemeService.getSchemeByConversationId(cid)
    if (existedSchemeForConversation) {
      await this.conversationSchemeService.updateExistedConversationScheme(cid, scheme, currentUserId)
    } else {
      await this.conversationSchemeService.createSchemeByConversationId(cid, scheme, currentUserId)
    }
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

export default ConversationSchemeCreateOperation
