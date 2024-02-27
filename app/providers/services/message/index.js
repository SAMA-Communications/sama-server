class MessageService {
  constructor(
    messageRepo,
    messageStatusRepo
  ) {
    this.messageRepo = messageRepo
    this.messageStatusRepo = messageStatusRepo
  }

  async create(currentUserId, blockedUserIds, messageParams) {
    messageParams.deleted_for = blockedUserIds
    messageParams.from = currentUserId

    const currentTs = Math.round(Date.now() / 1000).toFixed(0)
    messageParams.t = parseInt(currentTs)

    const message = await this.messageRepo.create(messageParams)

    return message
  }

  async aggregateLastMessageForConversation(cids, userId) {
    const aggregateLastMessage = await this.messageRepo.findLastMessageForConversations(cids, userId)

    const lastMessagesIds = Object.values(aggregateLastMessage).map(msg => msg._id)

    const aggregateLastMessageStatus = await this.messageStatusRepo.findReadStatusForMids(lastMessagesIds)

    Object.values(aggregateLastMessage).forEach(msg => {
      msg['status'] = aggregateLastMessageStatus[msg._id.toString()] ? 'read' : 'sent'
    })

    return aggregateLastMessage
  }

  async aggregateCountOfUnredMessagesByCid(cids, userId) {
    const lastReadMessageByUserForCids = await this.messageStatusRepo.findLastReadMessageByUserForCid(cids, userId)

    const unreadMessageCountByCids = await this.messageRepo.countUnreadMessagesByCids(cids, userId, lastReadMessageByUserForCids)

    return unreadMessageCountByCids
  }
}

export default MessageService
