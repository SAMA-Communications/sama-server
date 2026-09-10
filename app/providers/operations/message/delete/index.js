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
    const { conversation, asOwner, asAdmin } = await this.#hasAccess(organizationId, cId, currentUserId)

    const isDeleteAll = type === "all"
    const canModerate = this.#canModerate(conversation, asOwner, asAdmin)
    const messages = await this.messageService.findMessagesByIds(mIds)

    if (messages.length) {
      const messageIds = messages.map((message) => message._id)

      this.messageService.validateMessagesForDelete(messages, conversation._id, organizationId, currentUserId, {
        requireAuthorship: isDeleteAll && !canModerate,
      })

      if (isDeleteAll) {
        await this.messageService.deleteMessagesForEveryone(messageIds, conversation._id, organizationId, canModerate ? null : currentUserId)
      } else {
        await this.messageService.hideMessagesForUser(messageIds, currentUserId, conversation._id, organizationId)
      }
    }

    const deleteMessageFields = {
      messageIds: mIds,
      cid: cId,
      c_type: conversation.type,
      from: currentUserId,
    }

    const deletedMessages = isDeleteAll ? new DeleteMessagesPublicFields(deleteMessageFields) : null

    const participantsIds = conversation.type === "u" ? [conversation.owner_id, conversation.opponent_id] : null

    return { organizationId, cId: conversation._id, participantsIds, deletedMessages }
  }

  async #hasAccess(organizationId, conversationId, currentUserId) {
    const { conversation, asParticipant, asOwner, asAdmin } = await this.conversationService.hasAccessToConversation(
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

    return { conversation, asOwner, asAdmin }
  }

  #canModerate(conversation, asOwner, asAdmin) {
    return conversation.type !== "u" && (asOwner || asAdmin)
  }
}

export default MessageDeleteOperation
