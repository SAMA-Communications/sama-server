import BaseModel from "./base.js"

export default class BlockedUser extends BaseModel {
  static get collection() {
    return "blocked_users"
  }

  static get visibleFields() {
    return ["_id", "enabled", "user_id", "blocked_user_id", "created_at", "updated_at"]
  }
}
