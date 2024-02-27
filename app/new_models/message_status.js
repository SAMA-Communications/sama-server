import BaseModel from './base.js'

export default class MessageStatus extends BaseModel {
  static get collection() {
    return 'message_statuses'
  }

  static get visibleFields() {
    return [
      '_id',
      'cid',
      'mid',

      'created_at',

      'status',

      'user_id',
    ]
  }

  static get hiddenFields() {
    return [
      'updated_at',
    ]
  }
}
