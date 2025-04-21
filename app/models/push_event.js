import BaseModel from "./base.js"

export default class PushEvent extends BaseModel {
  static get collection() {
    return "push_events"
  }

  static get visibleFields() {
    return ["_id", "platform", "user_id", "user_ids", "message", "created_at", "updated_at"]
  }
}
