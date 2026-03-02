import BaseModel from "./base.js"

export default class EncryptedMessageStatus extends BaseModel {
  static get collection() {
    return "encrypted_message_statuses"
  }

  static get visibleFields() {
    return ["_id", "mid", "cid"]
  }

  static get hiddenFields() {
    return ["updated_at", "created_at"]
  }
}
