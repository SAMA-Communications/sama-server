import { ERROR_STATUES } from "../../../../constants/errors.js"
import DeleteMessagesPublicFields from "@sama/DTO/Response/message/delete/public_fields.js"

class MessageDeleteOperation {
  constructor(sessionService, conversationService, messageService) {
    this.sessionService = sessionService
    this.conversationService = conversationService
    this.messageService = messageService
  }

  async perform(ws, deleteMessageParams) {
    const { cid: cId, ids: mIds, type } = deleteMessageParams

    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)
    const { conversation, participantIds } = await this.#hasAccess(organizationId, cId, currentUserId)

    const isDeleteAll = type === "all"
    await this.messageService.deleteMessages(currentUserId, mIds, isDeleteAll)

    const deleteMessageFields = {
      messageIds: mIds,
      cid: cId,
      c_type: conversation.type,
      from: currentUserId,
    }

    const deletedMessages = isDeleteAll ? new DeleteMessagesPublicFields(deleteMessageFields) : null

    return { deletedMessages, participantIds }
  }

  async #hasAccess(organizationId, conversationId, currentUserId) {
    const { conversation, asParticipant, participantIds } = await this.conversationService.hasAccessToConversation(
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

    return { conversation, participantIds }
  }
}

export default MessageDeleteOperation
