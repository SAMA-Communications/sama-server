import { ERROR_STATUES } from "../../../../constants/errors.js"

class ConversationHandlerGetOperation {
  constructor(sessionService, conversationService, conversationHandlerService) {
    this.sessionService = sessionService
    this.conversationService = conversationService
    this.conversationHandlerService = conversationHandlerService
  }

  async perform(ws, handlerGetOptions) {
    const { cid } = handlerGetOptions
    const currentUserId = this.sessionService.getSessionUserId(ws)

    await this.#hasAccess(cid, currentUserId)

    const conversationHandler = await this.conversationHandlerService.getHandlerByConversationId(cid)
    if (!conversationHandler) {
      throw new Error(ERROR_STATUES.HANDLER_NOT_FOUND.message, {
        cause: ERROR_STATUES.HANDLER_NOT_FOUND,
      })
    }
    const { content, updated_by, updated_at } = conversationHandler

    return { content, updated_by, updated_at }
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

export default ConversationHandlerGetOperation
