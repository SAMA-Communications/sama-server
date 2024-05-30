import { ERROR_STATUES } from "../../../../constants/errors.js"

class MessageSendSystemOperation {
  constructor(sessionService, userService, conversationService, messageService) {
    this.sessionService = sessionService
    this.userService = userService
    this.conversationService = conversationService
    this.messageService = messageService
  }

  async perform(ws, systemMessageParams) {
    const { id, cid, uids, x } = systemMessageParams

    const currentUserId = this.sessionService.getSessionUserId(ws)

    let recipientsIds = []

    if (cid) {
      recipientsIds = await this.#conversationParticipants(cid, currentUserId)
    } else {
      recipientsIds = await this.userService.userRepo.retrieveExistedIds(uids)
    }

    const createSystemMessage = { id: id, x, from: currentUserId }

    const systemMessage = await this.messageService.createSystemMessage(createSystemMessage, cid)

    return { recipientsIds, systemMessage: systemMessage.serialize() }
  }

  async #conversationParticipants(conversationId, currentUserId) {
    const { conversation, asParticipant, participantIds } = await this.conversationService.hasAccessToConversation(
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

    return participantIds
  }
}

export default MessageSendSystemOperation
