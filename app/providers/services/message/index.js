class MessageService {
  constructor(
    messageRepo,
    messageStatusRepo
  ) {
    this.messageRepo = messageRepo
    this.messageStatusRepo = messageStatusRepo
  }

  async create(user, conversation, blockedUserIds, messageParams) {
    messageParams.cid = conversation._id
    messageParams.deleted_for = blockedUserIds
    messageParams.from = user.native_id

    const currentTs = Math.round(Date.now() / 1000).toFixed(0)
    messageParams.t = parseInt(currentTs)

    const message = await this.messageRepo.create(messageParams)

    return message
  }
  
  async messagesList(cId, user, options, limit) {
    const filterOptions = {}
    if (options.updatedAt?.gt) {
      filterOptions.updatedAtFrom = new Date(options.updatedAt.gt)
    }
    if (options.updatedAt?.lt) {
      filterOptions.updatedAtBefore = new Date(options.updatedAt.lt)
    }

    const messages = await this.messageRepo.list(cId, user.native_id, filterOptions, limit)

    const messageIds = messages.map(message => message._id)

    const messagesStatuses = await this.messageStatusRepo.findReadStatusForMids(messageIds)

    return { messages, messagesStatuses }
  }

  async hasAccessToMessage(messageId, userId) {
    const result = { message: null, asOwner: false }

    const message = await this.messageRepo.findById(messageId)

    if (!message) {
      return result
    }

    const deletedIds = message.deleted_for

    if (deletedIds.includes(userId)) {
      return result
    }

    result.message = message

    result.asOwner = message.from.toString() === userId.toString()

    return result
  }

  async readMessagesInConversation(cid, user, mids) {
    const findMessagesOptions = { mids }
    if (!mids) {
      const lastReadMessagesByConvIds = await this.messageStatusRepo.findLastReadMessageByUserForCid([cid], user.native_id)
      findMessagesOptions.lastReadMessageId = lastReadMessagesByConvIds[cid]?.mid || null
    }

    console.log('[readMessagesInConversation]', findMessagesOptions)

    const unreadMessages = await this.messageRepo.findAllOpponentsMessagesFromConversation(cid, user.native_id, findMessagesOptions)

    if (unreadMessages.length) {
      const mids = unreadMessages.map((message) => message._id).reverse()

      await this.messageStatusRepo.upsertMessageReadStatuses(cid, mids, user.native_id, 'read')
    }

    return unreadMessages
  }

  async aggregateLastMessageForConversation(cids, user) {
    const aggregateLastMessage = await this.messageRepo.findLastMessageForConversations(cids, user?.native_id)

    const lastMessagesIds = Object.values(aggregateLastMessage).map(msg => msg._id)

    const aggregateLastMessageStatus = await this.messageStatusRepo.findReadStatusForMids(lastMessagesIds)

    Object.values(aggregateLastMessage).forEach(message => {
      const status = aggregateLastMessageStatus[message._id.toString()] ? 'read' : 'sent'
      message.set('status', status)
    })

    return aggregateLastMessage
  }

  async aggregateCountOfUnreadMessagesByCid(cids, user) {
    const lastReadMessageByUserForCids = await this.messageStatusRepo.findLastReadMessageByUserForCid(cids, user.native_id)

    const unreadMessageCountByCids = await this.messageRepo.countUnreadMessagesByCids(cids, user.native_id, lastReadMessageByUserForCids)

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
