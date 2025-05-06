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

    await this.conversationService.validateAccessToConversation(cid, currentUserId)

    const conversationHandler = await this.conversationHandlerService.getHandlerByConversationId(cid)
    if (!conversationHandler) {
      throw new Error(ERROR_STATUES.HANDLER_NOT_FOUND.message, {
        cause: ERROR_STATUES.HANDLER_NOT_FOUND,
      })
    }
    const { content, updated_by, updated_at } = conversationHandler

    return { content, updated_by, updated_at }
  }
}

export default ConversationHandlerGetOperation
