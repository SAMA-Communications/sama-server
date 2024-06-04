import BaseRepository from "../base.js"

class MessageRepository extends BaseRepository {
  async prepareParams(params) {
    if (params.deleted_for?.length) {
      params.deleted_for = this.castObjectIds(params.deleted_for)
    }
    params.from = this.castObjectId(params.from)
    params.cid = this.castObjectId(params.cid)

    return await super.prepareParams(params)
  }

  async findAllOpponentsMessagesFromConversation(cid, readerUserId, { mids, lastReadMessageId }) {
    const idQuery = lastReadMessageId
      ? { $gt: this.castObjectId(lastReadMessageId) }
      : mids
        ? { $in: this.castObjectIds(mids) }
        : null

    const query = {
      cid: this.castObjectId(cid),
      from: { $ne: this.castObjectId(readerUserId) },
    }

    if (idQuery) {
      query._id = idQuery
    }

    const messages = await this.findAll(query)

    return messages
  }

  async findLastMessageForConversations(cids, userId) {
    cids = this.castObjectIds(cids)
    userId = this.castObjectId(userId)

    const $match = {
      cid: { $in: cids },
      deleted_for: { $nin: [userId] },
    }
    const $sort = { t: -1, _id: -1 }
    const $group = {
      _id: "$cid",
      last_message: { $first: "$$ROOT" },
    }

    const $project = { _id: 1, body: 1, from: 1, t: 1, cid: 1, attachments: 1 }

    const aggregatedResult = await this.aggregate([{ $match }, { $project }, { $sort }, { $group }])

    const result = {}

    aggregatedResult.forEach((obj) => {
      const msg = obj.last_message
      delete msg["cid"]
      result[obj._id] = this.wrapRawRecordInModel(msg)
    })

    return result
  }

  async list(conversationId, userId, options, limit) {
    const query = {
      cid: this.castObjectId(conversationId),
      deleted_for: { $nin: [this.castObjectId(userId)] },
    }

    if (options.updatedAtFrom) {
      query.updated_at = this.mergeOperators(query.updated_at, { $gt: options.updatedAtFrom })
    }
    if (options.updatedAtBefore) {
      query.updated_at = this.mergeOperators(query.updated_at, { $lt: options.updatedAtBefore })
    }

    const messages = await this.findAll(query, null, limit)

    return messages
  }

  async participantIdsFromMessages(cids, filteredUserIds) {
    const idsFromSenders = await this.distinct("from", { cid: { $in: cids }, from: { $nin: filteredUserIds } })

    const idsFromXParams = await this.distinct("x.user._id", {
      cid: { $in: cids },
      "x.user._id": { $nin: [...idsFromSenders, ...filteredUserIds] },
    })

    const result = [...idsFromSenders, ...idsFromXParams]

    return result
  }

  async countUnreadMessagesByCids(cids, userId, lastReadMessageByUserForCids) {
    const arrayParams = cids.map((cid) => {
      const query = { cid: this.castObjectId(cid), from: { $ne: this.castObjectId(userId) } }
      if (lastReadMessageByUserForCids[cid]) {
        query._id = { $gt: lastReadMessageByUserForCids[cid] }
      }
      return query
    })

    const $group = {
      _id: "$cid",
      count: { $sum: 1 },
    }

    const aggregatedResult = await this.aggregate([
      { $match: arrayParams.length ? { $or: arrayParams } : {} },
      { $group },
    ])

    const result = {}

    aggregatedResult?.forEach((obj) => {
      result[obj._id] = obj.count || 0
    })

    return result
  }

  async updateBody(messageId, newBody) {
    await this.updateOne({ _id: messageId }, { $set: { body: newBody } })
  }

  async updateDeleteForUser(messageIds, userId) {
    messageIds = this.castObjectIds(messageIds)

    await this.updateMany({ _id: { $in: messageIds } }, { $addToSet: { deleted_for: userId } })
  }
}

export default MessageRepository
