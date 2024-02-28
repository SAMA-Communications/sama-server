import BaseRepository from '../base.js'

class MessageStatusRepository extends BaseRepository {
  async prepareParams(params) {
    params.cid = this.safeWrapOId(params.cid)
    params.mid = this.safeWrapOId(params.mid)
    params.user_id = this.safeWrapOId(params.user_id)

    return await super.prepareParams(params)
  }
  
  async findReadStatusForMids(mids) {
    mids = mids.map(mid => this.safeWrapOId(mid))

    const $match = {
      mid: { $in: mids },
    }

    const $group = {
      _id: '$mid',
      users: { $push: '$user_id' },
    }

    const aggregatedResult = await this.aggregate([{ $match }, { $group }])

    const result = {}

    aggregatedResult.forEach((obj) => {
      result[obj._id] = [...new Set(obj.users)]
    })

    return result
  }

  async findLastReadMessageByUserForCid(cids, userId) {
    cids = cids.map(cid => this.safeWrapOId(cid))
    userId = this.safeWrapOId(userId)

    const $match = {
      cid: { $in: cids },
      user_id: userId,
    }

    const $sort = { _id: -1 }

    const $group = {
      _id: '$cid',
      last_message: { $first: '$$ROOT' },
    }

    const aggregatedResult = await this.aggregate([
      { $match },
      { $sort },
      { $group },
    ])

    const result = {}

    aggregatedResult.forEach((obj) => {
      result[obj._id] = obj.last_message.mid
    })

    return result
  }

  async getReadStatusForMids(mids) {
    mids = mids.map(mid => this.safeWrapOId(mid))

    const $match = {
      mid: { $in: mids },
    }
    const $group = {
      _id: '$mid',
      users: { $push: '$user_id' },
    }

    const aggregatedResult = await this.aggregate([{ $match }, { $group }])

    const result = {}

    aggregatedResult.forEach((obj) => {
      result[obj._id] = [...new Set(obj.users)]
    })

    return result
  }
}

export default MessageStatusRepository