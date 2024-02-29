import { ERROR_STATUES } from '../../../../constants/errors.js'

class MessageEditOperation {
  constructor(
    sessionService,
    messageService,
    conversationService,
  ) {
    this.sessionService = sessionService
    this.messageService = messageService
    this.conversationService = conversationService
  }

  async perform (ws, messageParams) {
    const { id: messageId, body: newBody } = messageParams

    const currentUserId = this.sessionService.getSessionUserId(ws)

    const message = await this.#hashAccess(messageId, currentUserId)

    await this.messageService.messageRepo.updateBody(messageId, newBody)

    const participantIds = await this.conversationService.findConversationParticipants(message.params.cid)

    return { messageId, body: newBody, from: currentUserId, participantIds }
  }

  async #hashAccess(messageId, currentUserId) {
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
