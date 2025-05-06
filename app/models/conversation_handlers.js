import BaseModel from "./base.js"

export default class ConversationHandler extends BaseModel {
  static get collection() {
    return "conversation_handlers"
  }

  static get visibleFields() {
    return ["_id", "conversation_id", "content", "updated_by"]
  }
}
