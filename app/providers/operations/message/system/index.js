import { ERROR_STATUES } from "@sama/constants/errors.js"
import SystemMessagePublicFields from "@sama/DTO/Response/message/system/public_fields.js"

class MessageSendSystemOperation {
  constructor(helpers, sessionService, userService, conversationService, messageService) {
    this.helpers = helpers
    this.sessionService = sessionService
    this.userService = userService
    this.conversationService = conversationService
    this.messageService = messageService
  }

  async perform(ws, createSystemMessageParams) {
    const { id, cid, uids, x } = createSystemMessageParams

    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    let recipientsIds = []

    if (cid) {
      recipientsIds = await this.#conversationParticipants(cid, currentUserId, organizationId)
    } else {
      recipientsIds = await this.userService.userRepo.retrieveExistedIds(organizationId, uids)
    }

    const systemMessageParams = {
      id: id,
      from: currentUserId,
      cid: cid,
      x,
      t: this.helpers.currentTimeStamp(),
    }

    return { recipientsIds, systemMessage: new SystemMessagePublicFields(systemMessageParams) }
  }

  async #conversationParticipants(conversationId, currentUserId, organizationId) {
    const { conversation, asParticipant, participantIds } = await this.conversationService.hasAccessToConversation(
      conversationId,
      currentUserId,
      organizationId,
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
