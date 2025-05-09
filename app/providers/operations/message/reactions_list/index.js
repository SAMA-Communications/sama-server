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
    const { message, selfDeleted } = await this.messageService.hasAccessToMessage(messageId, currentUserId)

    if (!message || selfDeleted) {
      throw new Error(ERROR_STATUES.MESSAGE_ID_NOT_FOUND.message, {
        cause: ERROR_STATUES.MESSAGE_ID_NOT_FOUND,
      })
    }

    return message
  }
}

export default MessageReactionsListOperation
