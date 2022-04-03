import BaseModel from './base/base.js';

export default class Messages extends BaseModel {
  static get collection() {
    return 'messages'
  }
}