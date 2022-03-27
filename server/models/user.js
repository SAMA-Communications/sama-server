import BaseModel from './base/base.js';

export default class User extends BaseModel {
  static get collection() {
    return 'users'
  }
}