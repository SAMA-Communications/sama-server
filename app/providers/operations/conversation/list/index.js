import { CONSTANTS as MAIN_CONSTANTS } from "../../../../constants/constants.js"
import MessagePublicFields from "@sama/DTO/Response/message/create/public_fields.js"

class ConversationListOperation {
  constructor(sessionService, userService, messagesService, conversationService) {
    this.sessionService = sessionService
    this.userService = userService
    this.messagesService = messagesService
    this.conversationService = conversationService
  }

  async perform(ws, options) {
    const { limit, updated_at, ids } = options
    const normalizedLimit = this.#normalizeLimitParam(limit)

    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)
    const currentUser = await this.userService.userRepo.findById(currentUserId)

    const conversations = await this.conversationService.conversationsList(currentUser, { updatedAt: updated_at, ids }, normalizedLimit)

    await this.#addMessagesInfo(conversations, currentUser)

    const conversationsWithImages = await this.conversationService.addImageUrl(
      conversations.map((conversion) => conversion.visibleParams())
    )

    return conversationsWithImages
  }

  async #addMessagesInfo(conversations, currentUser) {
    const conversationIds = conversations.map((conversation) => conversation._id)

    const lastMessagesListByCid = await this.messagesService.aggregateLastMessageForConversation(conversationIds, currentUser)
    const countOfUnreadMessagesByCid = await this.messagesService.aggregateCountOfUnreadMessagesByCid(conversationIds, currentUser)

    for (const conversation of conversations) {
      const conversationId = conversation._id.toString()
      const lastMessage = lastMessagesListByCid[conversationId]
      const lastMessageVal = lastMessage ? new MessagePublicFields(lastMessage) : void 0
      const unreadMessageCount = countOfUnreadMessagesByCid[conversationId] || 0

      conversation.set("last_message", lastMessageVal)
      conversation.set("unread_messages_count", unreadMessageCount)
    }
  }

  #normalizeLimitParam(limit) {
    if (limit > MAIN_CONSTANTS.CONVERSATION_LIMIT_MAX) {
      return MAIN_CONSTANTS.CONVERSATION_LIMIT_MAX
    }

    return limit || MAIN_CONSTANTS.CONVERSATION_LIMIT_MAX
  }
}

export default ConversationListOperation
