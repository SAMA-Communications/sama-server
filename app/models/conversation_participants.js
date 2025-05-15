import BaseModel from "./base.js"

export default class ConversationParticipant extends BaseModel {
  static get collection() {
    return "conversations_participants"
  }

  static get visibleFields() {
    return ["_id", "organization_id", "conversation_id", "user_id", "created_at", "updated_at"]
  }
}
