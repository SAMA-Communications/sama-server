import BaseModel from "./base.js"

export default class MessageReaction extends BaseModel {
  static get collection() {
    return "message_reactions"
  }

  static get visibleFields() {
    return ["_id", "mid", "user_id", "reaction"]
  }

  static get hiddenFields() {
    return ["updated_at", "created_at"]
  }
}
