import BaseModel from './base/base.js';

export default class User extends BaseModel {
  static get collection() {
    return 'users'
  }

  static get ALLOWED_API_REQ_FIELDS() {
    return ['login', 'password'];
  }
}