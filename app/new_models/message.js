import BaseModel from './base.js'

export default class Message extends BaseModel {
  static get collection() {
    return 'messages'
  }

  static get visibleFields() {
    return [
      '_id',
      'cid',

      't',
      'from',
      'body',
      'x',
      'attachments',

      'created_at',
    ]
  }

  static get hiddenFields() {
    return [
      'updated_at',
    ]
  }
}
