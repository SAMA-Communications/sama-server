import groupBy from "@sama/utils/groupBy.js"

class MessageReadOperation {
  constructor(sessionService, userService, messageService, conversationService) {
    this.sessionService = sessionService
    this.userService = userService
    this.messageService = messageService
    this.conversationService = conversationService
  }

  async perform(ws, messageParams) {
    const { cid, ids: mids } = messageParams

    const currentUserId = this.sessionService.getSessionUserId(ws)
    const currentUser = await this.userService.userRepo.findById(currentUserId)

    const unreadMessages = await this.messageService.readMessagesInConversation(cid, currentUser, mids)

    const unreadMessagesGroupedByFrom = groupBy(unreadMessages, "from")

    return { unreadMessagesGroupedByFrom, currentUserId }
  }
}

export default MessageReadOperation
