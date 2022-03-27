import BaseModel from './base/base.js';

export default class User extends BaseModel {
  get collection() {
    return 'users'
  }

  get visibleFields() {
    return ['_id', 'created_at', 'updated_at', 'login', 'password'];
  }
}