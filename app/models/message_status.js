import BaseModel from './base/base.js'
import { ObjectId } from '../lib/db.js'

export default class MessageStatus extends BaseModel {
  constructor(params) {
    super(params)
  }

  static get collection() {
    return 'message_statuses'
  }

  static get visibleFields() {
    return ['_id', 'cid', 'mid', 'user_id', 'created_at', 'status']
  }

  static async getReadStatusForMids(mids) {
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

  static async getLastReadMessageByUserForCid(cids, uId) {
    const $match = {
      cid: { $in: cids },
      user_id: ObjectId(uId),
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
}
