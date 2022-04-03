import BaseModel from './base/base.js';

export default class Conversation extends BaseModel {
  static get collection() {
    return 'conversations'
  }
}