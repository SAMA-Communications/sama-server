import { ERROR_STATUES } from "../../../../constants/errors.js"

class ConversationHandlerDeleteOperation {
  constructor(sessionService, conversationService, conversationHandlerService) {
    this.sessionService = sessionService
    this.conversationService = conversationService
    this.conversationHandlerService = conversationHandlerService
  }

  async perform(ws, handlerParams) {
    const { cid } = handlerParams
    const currentUserId = this.sessionService.getSessionUserId(ws)

    await this.#hasAccess(cid, currentUserId)

    const existedHandlerForConversation = await this.conversationHandlerService.getHandlerByConversationId(cid)
    if (!existedHandlerForConversation) {
      throw new Error(ERROR_STATUES.HANDLER_NOT_FOUND.message, {
        cause: ERROR_STATUES.HANDLER_NOT_FOUND,
      })
    }
    await this.conversationHandlerService.deleteConversationHandler(existedHandlerForConversation._id)
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

export default ConversationHandlerDeleteOperation
