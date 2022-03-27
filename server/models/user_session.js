import BaseModel from './base/base.js';

export default class UserSession extends BaseModel {
  static get collection() {
    return 'users_sessions'
  }
}