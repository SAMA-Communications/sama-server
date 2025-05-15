import { ERROR_STATUES } from "../../../../constants/errors.js"
import MessageReactionsUpdatePublicFields from "@sama/DTO/Response/message/reactions_update/public_fields.js"

class MessageReactionsUpdateOperation {
  constructor(sessionService, messageService, conversationService) {
    this.sessionService = sessionService
    this.messageService = messageService
    this.conversationService = conversationService
  }

  async perform(ws, messageUpdateReactionParams) {
    const { mid: messageId, add: addReaction, remove: removeReaction } = messageUpdateReactionParams

    const currentUserId = this.sessionService.getSessionUserId(ws)

    const message = await this.#hasAccess(messageId, currentUserId)

    const updateResult = await this.messageService.updateReactions(
      message._id,
      currentUserId,
      addReaction,
      removeReaction
    )

    if (!(updateResult.add || updateResult.remove)) {
      return { isUpdated: false }
    }

    const conversation = await this.conversationService.conversationRepo.findById(message.cid)

    const participantIds = await this.conversationService.findConversationParticipants(message.cid)

    const messageUpdateReactionParamsResult = {
      mid: messageId,
      cid: message.cid,
      c_type: conversation.type,
      from: currentUserId,
    }

    if (updateResult.add) {
      messageUpdateReactionParamsResult.add = addReaction
    }

    if (updateResult.remove) {
      messageUpdateReactionParamsResult.remove = removeReaction
    }

    return {
      messageReactionsUpdate: new MessageReactionsUpdatePublicFields(messageUpdateReactionParamsResult),
      participantIds,
      isUpdated: true,
    }
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

export default MessageReactionsUpdateOperation
