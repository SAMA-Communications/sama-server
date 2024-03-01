import { CONSTANTS as MAIN_CONSTANTS } from '../../../../constants/constants.js'

class ConversationListOperation {
  constructor(
    sessionService,
    messagesService,
    conversationService,
    conversationMapper
  ) {
    this.sessionService = sessionService
    this.messagesService = messagesService
    this.conversationService = conversationService
    this.conversationMapper = conversationMapper
  }

  async perform(ws, options) {
    const { limit, updated_at } = options
    const normalizedLimit = this.#normalizeLimitParam(limit)

    const currentUserId = this.sessionService.getSessionUserId(ws)

    const conversations = await this.conversationService.conversationsList(currentUserId, { updatedAt: updated_at }, normalizedLimit)
    
    const mappedConversations = conversations.map(conversion => conversion.visibleParams())

    await this.#addMessagesInfo(mappedConversations, currentUserId)

    return mappedConversations
  }

  async #addMessagesInfo(conversations, userId) {
    const conversationIds = conversations.map(conversation => conversation._id)

    const lastMessagesListByCid = await this.messagesService.aggregateLastMessageForConversation(conversationIds, userId)
    const countOfUnreadMessagesByCid = await this.messagesService.aggregateCountOfUnreadMessagesByCid(conversationIds, userId)

    for (const conversation of conversations) {
      const conversationId = conversation._id.toString()
      conversation['last_message'] = lastMessagesListByCid[conversationId]
      conversation['unread_messages_count'] = countOfUnreadMessagesByCid[conversationId] || 0
    }
  }

  #normalizeLimitParam(limit) {
    if (limit > MAIN_CONSTANTS.LIMIT_MAX) {
      return MAIN_CONSTANTS.LIMIT_MAX
    }

    return limit || MAIN_CONSTANTS.LIMIT_MAX
  }
}

export default ConversationListOperation
