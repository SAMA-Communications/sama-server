import { ERROR_STATUES } from '../../../../constants/errors.js'
import { CONSTANTS as MAIN_CONSTANTS } from '../../../../constants/constants.js'

class MessageListOperation {
  constructor(
    sessionService,
    userService,
    messageService,
    conversationService
  ) {
    this.sessionService = sessionService
    this.userService = userService
    this.messageService = messageService
    this.conversationService = conversationService
  }

  async perform (ws, messageListParams) {
    const { cid: cId, limit, updated_at } = messageListParams

    const currentUserId = this.sessionService.getSessionUserId(ws)
    const currentUser = await this.userService.userRepo.findById(currentUserId)

    await this.#hasAccess(cId, currentUserId)

    const normalizedLimit = this.#normalizeLimitParam(limit)

    const { messages, messagesStatuses } = await this.messageService.messagesList(
      cId,
      currentUser,
      { updatedAt: updated_at },
      normalizedLimit
    )

    const messagesWithStatus = await this.#assignMessageStatus(messages, messagesStatuses, currentUserId)

    return messagesWithStatus.map(message => message.visibleParams())
  }

  async #hasAccess(conversationId, currentUserId) {
    const { conversation, asParticipant } = await this.conversationService.hasAccessToConversation(conversationId, currentUserId)

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

  async #assignMessageStatus(messages, messagesStatuses, currentUserId) {
    for (const message of messages) {
      if (message.from.toString() === currentUserId.toString()) {
        const status = messagesStatuses[message._id]
        const statusName = status?.length ? 'read' : 'sent'
        message.set('status', statusName)
      }
    }

    return messages
  }

  #normalizeLimitParam(limit) {
    if (limit > MAIN_CONSTANTS.LIMIT_MAX) {
      return MAIN_CONSTANTS.LIMIT_MAX
    }

    return limit || MAIN_CONSTANTS.LIMIT_MAX
  }
}

export default MessageListOperation
