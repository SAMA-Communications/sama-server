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

  async hasAccessToMessage(messageId, userId) {
    const result = { message: null, asOwner: false }

    const message = await this.messageRepo.findById(messageId)

    if (!message) {
      return result
    }

    result.message = message

    result.asOwner = message.params.from.toString() === userId.toString()

    return result
  }

  async readMessagesInConversation(cid, userId, mids) {
    const findMessagesOptions = { mids }
    if (!mids) {
      const lastReadMessagesByConvIds = await this.messageStatusRepo.findLastReadMessageByUserForCid([cid], userId)
      findMessagesOptions.lastReadMessageId = lastReadMessagesByConvIds[cid]?.mid || null
    }

    const unreadMessages = await this.messageRepo.findAllOpponentsMessagesFromConversation(cid, userId, findMessagesOptions)

    if (unreadMessages.length) {
      const insertMessagesStatuses = unreadMessages.map((message) => {
        return {
          cid: cid,
          mid: message.params._id,
          user_id: userId,
          status: 'read',
        }
      })

      await this.messageStatusRepo.createMany(insertMessagesStatuses.reverse())
    }

    return unreadMessages
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

  async deleteMessages(userId, mIds, deleteAll) {
    if (deleteAll) {
      await this.messageRepo.deleteByIds(mIds)
    } else {
      await this.messageRepo.updateDeleteForUser(mIds, userId)
    }
  }
}

export default MessageService
