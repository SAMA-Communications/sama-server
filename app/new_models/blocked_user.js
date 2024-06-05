import BaseModel from './base.js'

export default class BlockedUser extends BaseModel {
  static get collection() {
    return 'blocked_users'
  }

  static get visibleFields() {
    return [
      '_id',

      'created_at',
      'updated_at',

      'enabled',

      'user_id',
      'blocked_user_id',

      'group',
      'system'
    ]
  }
}
