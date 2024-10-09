import BaseModel from "./base.js"

export default class Message extends BaseModel {
  static get collection() {
    return "messages"
  }

  static get visibleFields() {
    return [
      "_id",
      "cid",

      "t",
      "from",
      "body",
      "x",
      "attachments",
      "encrypted_message_type",

      "created_at",

      "status", // virtual
    ]
  }

  static get hiddenFields() {
    return ["updated_at", "expired_at", "identity_key"]
  }
}
