import BaseModel from "./base.js"

export default class MessageReaction extends BaseModel {
  static get collection() {
    return "conversations_participants"
  }

  static get visibleFields() {
    return ["_id", "mid", "user_id", "reaction"]
  }

  static get hiddenFields() {
    return ["updated_at", "created_at"]
  }
}
