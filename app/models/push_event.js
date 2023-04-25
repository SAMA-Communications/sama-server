import BaseModel from "./base/base.js";

export default class PushEvents extends BaseModel {
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
