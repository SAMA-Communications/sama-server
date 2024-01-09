import BaseModel from './base.js'
import MessageStatus from './message_status.js'
import { ObjectId } from '../lib/db.js'

export default class Message extends BaseModel {
  constructor(params) {
    super(params)
  }

  static get collection() {
    return 'messages'
  }

  static get visibleFields() {
    return [
      '_id',
      't',
      'from',
      'body',
      'cid',
      'x',
      'attachments',
      'created_at',
    ]
  }

  static async getLastMessageForConversation(cids, uId) {
    const $match = {
      cid: { $in: cids },
      deleted_for: { $nin: [uId] },
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
    const messageStatus = await MessageStatus.getReadStatusForMids(
      aggregatedResult.map((msg) => msg.last_message._id)
    )
    aggregatedResult.forEach((obj) => {
      const msg = obj.last_message
      delete msg['cid']
      msg['status'] = messageStatus[msg._id.toString()] ? 'read' : 'sent'
      result[obj._id] = msg
    })
    return result
  }

  static async getCountOfUnredMessagesByCid(cids, uId) {
    const lastReadMessageByUserForCids =
      await MessageStatus.getLastReadMessageByUserForCid(cids, uId)

    const arrayParams = cids.map((cid) => {
      const query = { cid: ObjectId(cid), from: { $ne: ObjectId(uId) } }
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
}
