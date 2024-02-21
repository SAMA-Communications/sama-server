import BaseModel from './base.js'

export default class Conversation extends BaseModel {
  static get collection() {
    return 'conversations'
  }

  static get visibleFields() {
    return [
      '_id',
  
      'name',
      'type',
      'description',

      'owner_id',
      'opponent_id',

      'created_at',
      'updated_at',
    ]
  }
}
