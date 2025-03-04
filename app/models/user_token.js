import BaseModel from "./base.js"

export default class UserToken extends BaseModel {
  static get collection() {
    return "user_tokens"
  }

  static get visibleFields() {
    return ["_id", "user_id", "device_id", "token", "created_at", "updated_at"]
  }
}
