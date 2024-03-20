import { ERROR_STATUES } from '../../../../constants/errors.js'
import DeleteMessagesPublicFields from '@sama/DTO/Response/message/delete/public_fields.js'

class MessageDeleteOperation {
  constructor(
    sessionService,
    conversationService,
    messageService
  ) {
    this.sessionService = sessionService
    this.conversationService = conversationService
    this.messageService = messageService
  }

  async perform (ws, deleteMessageParams) {
    const { cid: cId, ids: mIds, type } = deleteMessageParams

    const currentUserId = this.sessionService.getSessionUserId(ws)
    const participantIds = await this.#hasAccess(cId, currentUserId)

    const isDeleteAll = type === 'all'
    await this.messageService.deleteMessages(currentUserId, mIds, isDeleteAll)

    const deletedMessages = isDeleteAll ? new DeleteMessagesPublicFields({ messageIds: mIds, cid: cId, from: currentUserId }) : null

    return { deletedMessages, participantIds }
  }

  async #hasAccess(conversationId, currentUserId) {
    const { conversation, asParticipant, participantIds } = await this.conversationService.hasAccessToConversation(conversationId, currentUserId)

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

    return participantIds
  }
}

export default MessageDeleteOperation
