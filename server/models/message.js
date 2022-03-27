import BaseModel from './base/base.js';

export default class Messages extends BaseModel {
  get collection() {
    return 'messages'
  }
}