import BaseModel from '@sama/models/base/base.js'

export default class PushEvent extends BaseModel {
  constructor(params) {
    super(params);
  }
  static get collection() {
    return "push_events";
  }

  static get visibleFields() {
    return [
      "_id",
      "created_at",
      "updated_at",
      "user_id",
      "recipients_ids",
      "message",
    ];
  }
}
