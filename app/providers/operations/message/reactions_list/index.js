import { ERROR_STATUES } from "../../../../constants/errors.js"

class MessageReactionsListOperation {
  constructor(sessionService, messageService) {
    this.sessionService = sessionService
    this.messageService = messageService
  }

  async perform(ws, messageReactionListParams) {
    const { mid: messageId } = messageReactionListParams

    const currentUserId = this.sessionService.getSessionUserId(ws)

    const message = await this.#hasAccess(messageId, currentUserId)

    const reactions = await this.messageService.messageReactionRepo.aggregateMessageReactions(message._id)

    return { reactions: reactions }
  }

  async #hasAccess(messageId, currentUserId) {
    const { message, asOwner } = await this.messageService.hasAccessToMessage(messageId, currentUserId)

    if (!message) {
      throw new Error(ERROR_STATUES.MESSAGE_ID_NOT_FOUND.message, {
        cause: ERROR_STATUES.MESSAGE_ID_NOT_FOUND,
      })
    }

    if (!asOwner) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }

    return message
  }
}

export default MessageReactionsListOperation
