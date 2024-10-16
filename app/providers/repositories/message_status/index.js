import BaseRepository from "../base.js"

class MessageStatusRepository extends BaseRepository {
  async prepareParams(params) {
    params.cid = this.castObjectId(params.cid)
    params.mid = this.castObjectId(params.mid)
    params.user_id = this.castObjectId(params.user_id)

    return await super.prepareParams(params)
  }

  async upsertMessageReadStatuses(cid, mids, user_id, status) {
    const operations = []

    for (const mid of mids) {
      const params = await this.prepareParams({ cid, mid, user_id, status })
      const { cid: preparedCid, mid: preparedMid, user_id: preparedUserId, ...upsertParams } = params
      const operation = [{ cid: preparedCid, mid: preparedMid, user_id: preparedUserId }, { $set: upsertParams }]
      operations.push(operation)
    }

    await this.bulkUpsert(operations)
  }

  async findReadStatusForMids(mids) {
    mids = this.castObjectIds(mids)

    const $match = {
      mid: { $in: mids },
    }

    const $group = {
      _id: "$mid",
      users: { $addToSet: "$user_id" },
    }

    const aggregatedResult = await this.aggregate([{ $match }, { $group }])

    const result = {}

    aggregatedResult.forEach((obj) => {
      result[obj._id] = obj.users
    })

    return result
  }

  async findLastReadMessageByUserForCid(cids, userId) {
    cids = this.castObjectIds(cids)
    userId = this.castObjectId(userId)

    const $match = {
      cid: { $in: cids },
      user_id: userId,
    }

    const $sort = { _id: -1 }

    const $group = {
      _id: "$cid",
      last_message: { $first: "$$ROOT" },
    }

    const aggregatedResult = await this.aggregate([{ $match }, { $sort }, { $group }])

    const result = {}

    aggregatedResult.forEach((obj) => {
      result[obj._id] = obj.last_message.mid
    })

    return result
  }

  async deleteByMidsAndCid(mids, cid) {
    await this.deleteMany({ mid: { $in: mids }, cid })
  }
}

export default MessageStatusRepository
