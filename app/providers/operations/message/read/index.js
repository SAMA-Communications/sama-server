import { ERROR_STATUES } from "../../../../constants/errors.js"
import groupBy from "@sama/utils/groupBy.js"
import ReadMessagesPublicFields from "@sama/DTO/Response/message/read/public_fields.js"

class MessageReadOperation {
  constructor(sessionService, userService, messageService, conversationService) {
    this.sessionService = sessionService
    this.userService = userService
    this.messageService = messageService
    this.conversationService = conversationService
  }

  async perform(ws, messageParams) {
    const { cid, ids: mids } = messageParams

    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)
    const currentUser = await this.userService.userRepo.findById(currentUserId)

    await this.#hasAccess(cId, currentUserId, organizationId)

    const unreadMessages = await this.messageService.readMessagesInConversation(cid, currentUser, mids)

    const unreadMessagesGroupedByFrom = groupBy(unreadMessages, "from")

    const readMessagesGroups = Object.entries(unreadMessagesGroupedByFrom).map(([userId, messages]) => {
      const firstMessage = messages.at(0)
      const cId = firstMessage.cid
      const messageIds = messages.map((message) => message._id)
      const readMessages = new ReadMessagesPublicFields({ cid: cId, messageIds, from: currentUserId })

      return { userId, readMessages }
    })

    return { readMessagesGroups }
  }

  async #hasAccess(conversationId, currentUserId, organizationId) {
    const { conversation, asParticipant } = await this.conversationService.hasAccessToConversation(
      conversationId,
      currentUserId,
      organizationId
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
  }
}

export default MessageReadOperation
