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

    let recipientsIds = null

    if (!cid) {
      recipientsIds = await this.userService.userRepo.retrieveExistedIds(organizationId, uids)
    } else {
      const conversation = await this.#hasAccess(organizationId, cid, currentUserId)
      recipientsIds = conversation.type === "u" ? [conversation.owner_id, conversation.opponent_id] : null
    }

    const systemMessageParams = {
      id: id,
      from: currentUserId,
      cid: cid,
      x,
      t: this.helpers.currentTimeStamp(),
    }

    return {
      organizationId,
      cId: cid,
      recipientsIds,
      systemMessage: new SystemMessagePublicFields(systemMessageParams),
    }
  }

  async #hasAccess(organizationId, conversationId, currentUserId) {
    const { conversation, asParticipant } = await this.conversationService.hasAccessToConversation(
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

    return conversation
  }
}

export default MessageSendSystemOperation
