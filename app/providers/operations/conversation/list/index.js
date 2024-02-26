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
    let { limit, updated_at } = options
    limit = limit > MAIN_CONSTANTS.LIMIT_MAX ? MAIN_CONSTANTS.LIMIT_MAX : limit ?? MAIN_CONSTANTS.LIMIT_MAX

    const currentUserId = this.sessionService.getSessionUserId(ws)

    const conversations = await this.conversationService.conversationsList(currentUserId, limit, { updated_at })
    
    let mappedConversations = []

    for (const conversation of conversations) {
      const mappedConversation = await this.conversationMapper(conversation)
      mappedConversations.push(mappedConversation.params)
    }

    mappedConversations = await this.#addMessagesInfo(mappedConversations, currentUserId)

    return mappedConversations
  }

  async #addMessagesInfo(conversations, userId) {
    const conversationIds = conversations.map(conversation => conversation._id)

    const lastMessagesListByCid = await this.messagesService.getLastMessageForConversation(conversationIds, userId)
    const countOfUnreadMessagesByCid = await this.messagesService.getCountOfUnredMessagesByCid(conversationIds, userId)

    for (const conversation of conversations) {
      const conversationId = conversation._id.toString()
      conversation['last_message'] = lastMessagesListByCid[conversationId]
      conversation['unread_messages_count'] = countOfUnreadMessagesByCid[conversationId] || 0
    }

    return conversations
  }
}

export default ConversationListOperation
