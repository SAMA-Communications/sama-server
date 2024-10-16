class MessageService {
  constructor(helpers, messageRepo, messageStatusRepo, encryptionRepo, encryptedMessageStatusRepo) {
    this.helpers = helpers
    this.messageRepo = messageRepo
    this.messageStatusRepo = messageStatusRepo
    this.encryptionRepo = encryptionRepo
    this.encryptedMessageStatusRepo = encryptedMessageStatusRepo
  }

  async create(user, conversation, blockedUserIds, messageParams) {
    messageParams.cid = conversation._id
    messageParams.deleted_for = blockedUserIds
    messageParams.from = user.native_id

    messageParams.t = this.helpers.currentTimeStamp()

    return await this.messageRepo.create(messageParams)
  }

  async messagesList(cid, user, options, limit, isEncrypted, deviceId) {
    const filterOptions = {}
    if (options.updatedAt?.gt) {
      filterOptions.updatedAtFrom = new Date(options.updatedAt.gt)
    }
    if (options.updatedAt?.lt) {
      filterOptions.updatedAtBefore = new Date(options.updatedAt.lt)
    }

    let messageIds = [],
      messageIdsToRemove = [],
      messages

    if (isEncrypted) {
      const identityKey = await this.encryptionRepo.getIdentityKeyByUserId(user.native_id, deviceId)
      const { midsToDelivery, midsToRemove } = await this.encryptedMessageStatusRepo.getMidsByIdentityKey(
        identityKey,
        cid
      )

      messageIds = midsToDelivery
      messageIdsToRemove = midsToRemove
      messages = await this.messageRepo.listByMids(messageIds, filterOptions, limit)
    } else {
      messages = await this.messageRepo.list(cid, user.native_id, filterOptions, limit)
      messageIds = messages.map((message) => message._id)
    }

    const messagesStatuses = await this.messageStatusRepo.findReadStatusForMids(messageIds)

    if (messageIdsToRemove.length) {
      await this.messageRepo.deleteMessageByMids(messageIdsToRemove)
      await this.messageStatusRepo.deleteByMidsAndCid(messageIdsToRemove, cid, user.native_id)
    }

    return { messages, messagesStatuses }
  }

  async hasAccessToMessage(messageId, userId) {
    const result = { message: null, asOwner: false, selfDeleted: false }

    const message = await this.messageRepo.findById(messageId)

    if (!message) {
      return result
    }

    const deletedIds = message.deleted_for || []
    result.selfDeleted = deletedIds.includes(userId)

    if (result.selfDeleted) {
      return result
    }

    result.message = message

    result.asOwner = this.helpers.isEqualsNativeIds(message.from, userId)

    return result
  }

  async readMessagesInConversation(cid, user, mids) {
    const findMessagesOptions = { mids }
    if (!mids) {
      const lastReadMessagesByConvIds = await this.messageStatusRepo.findLastReadMessageByUserForCid(
        [cid],
        user.native_id
      )
      findMessagesOptions.lastReadMessageId = lastReadMessagesByConvIds[cid]?.mid || null
    }

    const unreadMessages = await this.messageRepo.findAllOpponentsMessagesFromConversation(
      cid,
      user.native_id,
      findMessagesOptions
    )

    if (unreadMessages.length) {
      const mids = unreadMessages.map((message) => message._id).reverse()

      await this.messageStatusRepo.upsertMessageReadStatuses(cid, mids, user.native_id, "read")
    }

    return unreadMessages
  }

  async aggregateLastMessageForConversation(cids, user) {
    const aggregateLastMessage = await this.messageRepo.findLastMessageForConversations(cids, user?.native_id)

    const lastMessagesIds = Object.values(aggregateLastMessage).map((msg) => msg._id)

    const aggregateLastMessageStatus = await this.messageStatusRepo.findReadStatusForMids(lastMessagesIds)

    Object.values(aggregateLastMessage).forEach((message) => {
      const status = aggregateLastMessageStatus[message._id.toString()] ? "read" : "sent"
      message.set("status", status)
    })

    return aggregateLastMessage
  }

  async aggregateCountOfUnreadMessagesByCid(cids, user) {
    const lastReadMessageByUserForCids = await this.messageStatusRepo.findLastReadMessageByUserForCid(
      cids,
      user.native_id
    )

    const unreadMessageCountByCids = await this.messageRepo.countUnreadMessagesByCids(
      cids,
      user.native_id,
      lastReadMessageByUserForCids
    )

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
