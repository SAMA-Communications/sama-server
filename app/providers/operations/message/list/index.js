import { ERROR_STATUES } from "../../../../constants/errors.js"
import { CONSTANTS as MAIN_CONSTANTS } from "../../../../constants/constants.js"
import MessagePublicFields from "@sama/DTO/Response/message/create/public_fields.js"

class MessageListOperation {
  constructor(helpers, sessionService, userService, messageService, conversationService) {
    this.helpers = helpers
    this.sessionService = sessionService
    this.userService = userService
    this.messageService = messageService
    this.conversationService = conversationService
  }

  async perform(ws, messageListParams) {
    const { cid: cId, limit, updated_at } = messageListParams

    const currentUserId = this.sessionService.getSessionUserId(ws)
    const currentUser = await this.userService.userRepo.findById(currentUserId)

    await this.#hasAccess(cId, currentUserId)

    const normalizedLimit = this.#normalizeLimitParam(limit)

    const { messages, messagesStatuses, messagesReactions } = await this.messageService.messagesList(
      cId,
      currentUser,
      { updatedAt: updated_at },
      normalizedLimit
    )

    const messagesWithVirtualFields = await this.#assignMessageVirtualFields(
      messages,
      messagesStatuses,
      messagesReactions,
      currentUserId
    )

    return messagesWithVirtualFields.map((message) => new MessagePublicFields(message))
  }

  async #hasAccess(conversationId, currentUserId) {
    const { conversation, asParticipant } = await this.conversationService.hasAccessToConversation(
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
    if (limit > MAIN_CONSTANTS.MESSAGE_LIMIT_MAX) {
      return MAIN_CONSTANTS.MESSAGE_LIMIT_MAX
    }

    return limit || MAIN_CONSTANTS.MESSAGE_LIMIT_MAX
  }
}

export default MessageListOperation
