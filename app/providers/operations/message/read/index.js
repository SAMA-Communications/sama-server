import groupBy from '@sama/utils/groupBy.js'

class MessageReadOperation {
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
    const { cid, ids: mids } = messageParams

    const currentUserId = this.sessionService.getSessionUserId(ws)

    const unreadMessages = await this.messageService.readMessagesInConversation(cid, currentUserId, mids)

    const unreadMessagesGroupedByFrom = groupBy(unreadMessages.map(msg => msg.params), 'from')

    return { unreadMessagesGroupedByFrom, currentUserId } 
  }
}

export default MessageReadOperation
