import BaseRepository from '../base.js'

class MessageRepository extends BaseRepository {
  async prepareParams(params) {
    if (params.deleted_for?.length) {
      params.deleted_for = params.deleted_for.map(userId => this.safeWrapOId(userId))
    }
    params.from = this.safeWrapOId(params.from)
    params.cid = this.safeWrapOId(params.cid)

    return await super.prepareParams(params)
  }

  async findAllOpponentsMessagesFromConversation(cid, readerUserId, { mids, lastReadMessageId }) {
    const query = {
      cid: this.safeWrapOId(cid),
      from: { $ne: this.safeWrapOId(readerUserId) },
      _id: lastReadMessageId ?  { $gt: this.safeWrapOId(lastReadMessageId) } : { $in: mids }
    }

    const messages = await this.findAll(query)

    return messages
  }

  async findLastMessageForConversations(cids, userId) {
    cids = cids.map(cid => this.safeWrapOId(cid))
    userId = this.safeWrapOId(userId)

    const $match = {
      cid: { $in: cids },
      deleted_for: { $nin: [userId] },
    }
    const $sort = { t: -1, _id: -1 }
    const $group = {
      _id: '$cid',
      last_message: { $first: '$$ROOT' },
    }

    const $project = { _id: 1, body: 1, from: 1, t: 1, cid: 1, attachments: 1 }

    const aggregatedResult = await this.aggregate([
      { $match },
      { $project },
      { $sort },
      { $group },
    ])

    const result = {}

    aggregatedResult.forEach((obj) => {
      const msg = obj.last_message
      delete msg['cid']
      result[obj._id] = msg
    })

    return result
  }

  async countUnreadMessagesByCids(cids, userId, lastReadMessageByUserForCids) {
    const arrayParams = cids.map((cid) => {
      const query = { cid: this.safeWrapOId(cid), from: { $ne: this.safeWrapOId(userId) } }
      if (lastReadMessageByUserForCids[cid]) {
        query._id = { $gt: lastReadMessageByUserForCids[cid] }
      }
      return query
    })

    const $group = {
      _id: '$cid',
      unread_messages: { $push: '$_id' },
    }

    const aggregatedResult = await this.aggregate([
      { $match: arrayParams.length ? { $or: arrayParams } : {} },
      { $group },
    ])

    const result = {}

    aggregatedResult?.forEach((obj) => {
      result[obj._id] = [...new Set(obj.unread_messages)].length
    })

    return result
  }

  async updateBody(messageId, newBody) {
    await this.updateOne({ _id: messageId }, { $set: { body: newBody } })
  }

  async updateDeleteForUser(messageIds, userId) {
    messageIds.map(mId => this.safeWrapOId(mId))

    await this.updateMany({ _id: { $in: messageIds } }, { $addToSet: { deleted_for: userId } })
  }
}

export default MessageRepository
