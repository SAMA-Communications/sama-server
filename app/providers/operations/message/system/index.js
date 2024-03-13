import { ERROR_STATUES } from '../../../../constants/errors.js'

class MessageSendSystemOperation {
  constructor(
    sessionService,
    userService,
    conversationService,
  ) {
    this.sessionService = sessionService
    this.userService = userService
    this.conversationService = conversationService
  }

  async perform (ws, messageParams) {
    const { id, cid, uids, x } = messageParams

    const currentUserId = this.sessionService.getSessionUserId(ws)

    let recipientsIds = []

    if (cid) {
      recipientsIds = await this.#hashAccessToConversation(cid, currentUserId)
    } else {
      recipientsIds = await this.userService.userRepo.retrieveExistedIds(uids)
    }

    const currentTs = Math.floor(new Date().getTime() / 1000)

    const systemMessage = {
      _id: id,
      t: currentTs,
      from: currentUserId,
      x
    }

    if (cid) {
      systemMessage.cid = cid
    }

    return { recipientsIds, systemMessage }
  }

  async #hashAccessToConversation(conversationId, currentUserId) {
    const { conversation, asParticipant, participantIds } = await this.conversationService.hashAccessToConversation(conversationId, currentUserId)

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