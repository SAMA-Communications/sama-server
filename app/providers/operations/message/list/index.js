import { ERROR_STATUES } from "../../../../constants/errors.js"
import MessagePublicFields from "@sama/DTO/Response/message/create/public_fields.js"

class MessageListOperation {
  constructor(config, helpers, sessionService, userService, messageService, conversationService) {
    this.config = config
    this.helpers = helpers
    this.sessionService = sessionService
    this.userService = userService
    this.messageService = messageService
    this.conversationService = conversationService
  }

  async perform(ws, messageListParams) {
    const { cid: cId, limit, updated_at } = messageListParams

    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)
    const currentUser = await this.userService.userRepo.findById(currentUserId)

    await this.#hasAccess(organizationId, cId, currentUserId)

    const normalizedLimit = this.#normalizeLimitParam(limit)

    const { messages, messagesStatuses, messagesReactions } = await this.messageService.messagesList(
      cId,
      currentUser,
      { updatedAt: updated_at },
      normalizedLimit
    )

    const messagesWithVirtualFields = await this.#assignMessageVirtualFields(messages, messagesStatuses, messagesReactions, currentUserId)

    return messagesWithVirtualFields.map((message) => new MessagePublicFields(message))
  }

  async #hasAccess(organizationId, conversationId, currentUserId) {
    const { conversation, asParticipant } = await this.conversationService.hasAccessToConversation(
      organizationId,
      conversationId,
      currentUserId
    )

    if (!conversation) {
      throw new Error(ERROR_STATUES.CONVERSATION_NOT_FOUND.message, {
        cause: ERROR_STATUES.CONVERSATION_NOT_FOUND,
      })
    }

    if (!asParticipant) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }
  }

  async #assignMessageVirtualFields(messages, messagesStatuses, messagesReactions, currentUserId) {
    for (const message of messages) {
      if (this.helpers.isEqualsNativeIds(message.from, currentUserId)) {
        const status = messagesStatuses[message._id]
        const statusName = status?.length ? "read" : "sent"
        message.set("status", statusName)
      }

      message.set("reactions", messagesReactions[message._id] ?? {})
    }

    return messages
  }

  #normalizeLimitParam(limit) {
    const preloadCount = this.config.get("conversation.messages.preloadCount")

    if (limit > preloadCount) {
      return preloadCount
    }

    return limit || preloadCount
  }
}

export default MessageListOperation
