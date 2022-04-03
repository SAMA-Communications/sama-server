import BaseModel from './base/base.js';

export default class ConversationParticipant extends BaseModel {
  static get collection() {
    return 'conversations_participants'
  }
}