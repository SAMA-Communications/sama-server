import BaseModel from './base/base.js';

export default class UserSession extends BaseModel {
  get collection() {
    return 'users_sessions'
  }
}