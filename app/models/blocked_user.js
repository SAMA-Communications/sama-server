import BaseModel from './base/base.js'

export default class BlockedUser extends BaseModel {
  constructor(params) {
    super(params)
  }

  static get collection() {
    return 'blocked_users'
  }

  static get visibleFields() {
    return ['_id', 'created_at', 'updated_at', 'blocked_user_id', 'user_id']
  }
}
