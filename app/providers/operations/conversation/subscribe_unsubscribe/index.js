import { ERROR_STATUES } from "../../../../constants/errors.js"

class ConversationSubscribeUnsubscribeOperation {
  constructor(
    helpers,
    sessionService,
    userService,
    conversationService,
  ) {
    this.helpers = helpers
    this.sessionService = sessionService
    this.userService = userService
    this.conversationService = conversationService
  }

  async perform(ws, type, params) {
    const { cid: conversationId } = params
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const conversation = await this.#retrieveConversation(organizationId, conversationId)
    
    if (type === "subscribe") {
      await this.#subscribe(conversation, currentUserId)
    } else {
      await this.#unsubscribe(conversation, currentUserId)
    }
  }

  async #subscribe(conversation, userId) {
    await this.conversationService.addParticipants(conversation, [userId], [])
  }

  async #unsubscribe(conversation, userId) {
    await this.conversationService.removeParticipants(conversation, [userId], [userId])
  }

  async #retrieveConversation(organizationId, conversationId) {
    const conversation = await this.conversationService.conversationRepo.findByIdWithOrgScope(organizationId, conversationId)

    if (!conversation) {
      throw new Error(ERROR_STATUES.BAD_REQUEST.message, {
        cause: ERROR_STATUES.BAD_REQUEST,
      })
    }

    return conversation
  }
}

export default ConversationSubscribeUnsubscribeOperation
