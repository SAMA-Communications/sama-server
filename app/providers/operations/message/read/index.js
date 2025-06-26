import { ERROR_STATUES } from "../../../../constants/errors.js"
import groupBy from "@sama/utils/groupBy.js"
import ReadMessagesPublicFields from "@sama/DTO/Response/message/read/public_fields.js"

class MessageReadOperation {
  constructor(sessionService, messageService, conversationService) {
    this.sessionService = sessionService
    this.messageService = messageService
    this.conversationService = conversationService
  }

  async perform(ws, messageParams) {
    const { cid, ids: mids } = messageParams

    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    await this.#hasAccess(organizationId, cid, currentUserId)

    const unreadMessages = await this.messageService.readMessagesInConversation(
      organizationId,
      cid,
      currentUserId,
      mids
    )

    const unreadMessagesGroupedByFrom = groupBy(unreadMessages, "from")

    const readMessagesGroups = Object.entries(unreadMessagesGroupedByFrom).map(([userId, messages]) => {
      const firstMessage = messages.at(0)
      const cId = firstMessage.cid
      const messageIds = messages.map((message) => message._id)
      const readMessages = new ReadMessagesPublicFields({ cid: cId, messageIds, from: currentUserId })

      return { userId, readMessages }
    })

    return { organizationId, readMessagesGroups }
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

    if (conversation.type === "c") {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }

    if (!asParticipant) {
      throw new Error(ERROR_STATUES.FORBIDDEN.message, {
        cause: ERROR_STATUES.FORBIDDEN,
      })
    }
  }
}

export default MessageReadOperation
