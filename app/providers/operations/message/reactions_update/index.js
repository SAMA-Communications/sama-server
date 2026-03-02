import { ERROR_STATUES } from "../../../../constants/errors.js"
import MessageReactionsUpdatePublicFields from "@sama/DTO/Response/message/reactions_update/public_fields.js"

class MessageReactionsUpdateOperation {
  constructor(config, sessionService, messageService, conversationService) {
    this.config = config
    this.sessionService = sessionService
    this.messageService = messageService
    this.conversationService = conversationService
  }

  async perform(ws, messageUpdateReactionParams) {
    const { mid: messageId, add: addReaction, remove: removeReaction } = messageUpdateReactionParams

    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const message = await this.#hasAccess(messageId, currentUserId)

    const updateResult = await this.messageService.updateReactions(message._id, currentUserId, addReaction, removeReaction)

    if (!(updateResult.add || updateResult.remove)) {
      return { isUpdated: false }
    }

    const conversation = await this.conversationService.conversationRepo.findById(message.cid)

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

    const participantsIds = conversation.type === "u" ? [conversation.owner_id, conversation.opponent_id] : null
    let isUpdated = true

    if (!this.config.get("conversation.disableChannelsLogic") && conversation.type === "c") {
      isUpdated = false
    }

    return {
      organizationId,
      cId: conversation._id,
      participantsIds,
      messageReactionsUpdate: new MessageReactionsUpdatePublicFields(messageUpdateReactionParamsResult),
      isUpdated,
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
