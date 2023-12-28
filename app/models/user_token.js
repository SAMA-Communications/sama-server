import BaseModel from './base/base.js'

export default class UserToken extends BaseModel {
  constructor(params) {
    super(params)
  }

  static get collection() {
    return 'user_tokens'
  }

  static get visibleFields() {
    return ['_id', 'created_at', 'updated_at', 'user_id', 'device_id', 'token']
  }
}
