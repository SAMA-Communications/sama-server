import BaseModel from './base/base.js';

export default class Conversation extends BaseModel {
  get collection() {
    return 'conversations'
  }
}