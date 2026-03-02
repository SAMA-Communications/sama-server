import { ERROR_STATUES } from "../../../../constants/errors.js"
import EditMessagePublicFields from "@sama/DTO/Response/message/edit/public_fields.js"

class MessageEditOperation {
  constructor(sessionService, messageService, conversationService) {
    this.sessionService = sessionService
    this.messageService = messageService
    this.conversationService = conversationService
  }

  async perform(ws, messageParams) {
    const { id: messageId, body: newBody } = messageParams

    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const message = await this.#hasAccess(messageId, currentUserId)

    await this.messageService.messageRepo.updateBody(messageId, newBody)

    const conversation = await this.conversationService.conversationRepo.findById(message.cid)

    const editedMessageParams = {
      messageId,
      cid: message.cid,
      c_type: conversation.type,
      from: currentUserId,
      body: newBody,
    }

    const participantsIds = conversation.type === "u" ? [conversation.owner_id, conversation.opponent_id] : null

    return {
      organizationId,
      cId: conversation._id,
      participantsIds,
      editedMessage: new EditMessagePublicFields(editedMessageParams),
    }
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

export default MessageEditOperation
