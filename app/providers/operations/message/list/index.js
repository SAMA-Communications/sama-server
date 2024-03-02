import { ERROR_STATUES } from '../../../../constants/errors.js'
import { CONSTANTS as MAIN_CONSTANTS } from '../../../../constants/constants.js'

class MessageListOperation {
  constructor(
    sessionService,
    messageService,
    conversationService
  ) {
    this.sessionService = sessionService
    this.messageService = messageService
    this.conversationService = conversationService
  }

  async perform (ws, messageListParams) {
    const { cid: cId, limit, updated_at } = messageListParams

    const currentUserId = this.sessionService.getSessionUserId(ws)

    await this.#hashAccess(cId, currentUserId)

    const normalizedLimit = this.#normalizeLimitParam(limit)

    const { messages, messagesStatuses } = await this.messageService.messagesList(
      cId,
      currentUserId,
      { updatedAt: updated_at },
      normalizedLimit
    )

    const messagesWithStatus = await this.#assignMessageStatus(messages, messagesStatuses, currentUserId)

    return messagesWithStatus
  }

  async #hashAccess(conversationId, currentUserId) {
    const { conversation, asParticipant } = await this.conversationService.hashAccessToConversation(conversationId, currentUserId)

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
    const mappedMessages = messages.map(message => message.visibleParams())

    for (const message of mappedMessages) {
      if (message.from == currentUserId) {
        const status = messagesStatuses[message._id]
        message.status = status?.length ? 'read' : 'sent'
      }
    }

    return mappedMessages
  }

  #normalizeLimitParam(limit) {
    if (limit > MAIN_CONSTANTS.LIMIT_MAX) {
      return MAIN_CONSTANTS.LIMIT_MAX
    }

    return limit || MAIN_CONSTANTS.LIMIT_MAX
  }
}

export default MessageListOperation
