import { ERROR_STATUES } from '../../../../constants/errors.js'
import { CONSTANTS as MAIN_CONSTANTS } from '../../../../constants/constants.js'

class MessageListOperation {
  constructor(
    sessionService,
    messageService,
    conversationService,
    messageMapper
  ) {
    this.sessionService = sessionService
    this.messageService = messageService
    this.conversationService = conversationService,
    this.messageMapper = messageMapper
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

    const mappedMessages = await this.#assignMessageStatus(messages, messagesStatuses, currentUserId)

    return mappedMessages
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
    const mappedMessages = []

    for (const message of messages) {
      const mappedMessage = await this.messageMapper(message)
      mappedMessages.push(mappedMessage.params)
    }

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
