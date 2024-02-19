import BaseModel from './base.js'

export default class User extends BaseModel {
  static get collection() {
    return 'users'
  }

  static get visibleFields() {
    return [
      '_id',

      'created_at',
      'updated_at',
      'recent_activity',

      'first_name',
      'last_name',
      'login',
      'email',
      'phone',
    ]
  }

  static get hiddenFields() {
    return [
      'encrypted_password',
      'password_salt'
    ]
  }
}
