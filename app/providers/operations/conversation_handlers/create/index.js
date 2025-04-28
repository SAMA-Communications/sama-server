import { ERROR_STATUES } from "../../../../constants/errors.js"

class ConversationHandlerCreateOperation {
  constructor(sessionService, conversationService, conversationHandlerService) {
    this.sessionService = sessionService
    this.conversationService = conversationService
    this.conversationHandlerService = conversationHandlerService
  }

  async perform(ws, schemeParams) {
    const { cid, content } = schemeParams
    const currentUserId = this.sessionService.getSessionUserId(ws)

    await this.conversationService.validateAccessToConversation(cid, currentUserId)

    const existedHandlerForConversation = await this.conversationHandlerService.getHandlerByConversationId(cid)
    if (existedHandlerForConversation) {
      await this.conversationHandlerService.updateExistedConversationHandler(cid, content, currentUserId)
    } else {
      await this.conversationHandlerService.createHandlerByConversationId(cid, content, currentUserId)
    }
  }
}

export default ConversationHandlerCreateOperation
