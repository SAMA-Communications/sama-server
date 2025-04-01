import BaseModel from "./base.js"

export default class ConversationScheme extends BaseModel {
  static get collection() {
    return "conversation_schemes"
  }

  static get visibleFields() {
    return ["_id", "conversation_id", "scheme", "updated_by"]
  }
}
