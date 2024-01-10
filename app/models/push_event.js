import BaseModel from '@sama/models/base.js'

export default class PushEvent extends BaseModel {
  constructor(params) {
    super(params)
  }
  static get collection() {
    return 'push_events'
  }

  static get visibleFields() {
    return [
      '_id',
      'created_at',
      'updated_at',
      'platform',
      'user_id',
      'user_ids',
      'message',
    ]
  }
}
