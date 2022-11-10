import BaseModel from "./base/base.js";

export default class ConversationParticipant extends BaseModel {
  constructor(params) {
    super(params);
  }

  static get collection() {
    return "conversations_participants";
  }

  static get visibleFields() {
    return [
      "_id",
      "created_at",
      "updated_at",
      "conversation_id",
      "user_id",
      "unread_messages",
    ];
  }
}
