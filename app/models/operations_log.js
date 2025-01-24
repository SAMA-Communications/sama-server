import BaseModel from "./base.js"

export default class OpLog extends BaseModel {
  static get collection() {
    return "operations_log"
  }

  static get visibleFields() {
    return ["_id", "user_id", "packet", "created_at", "updated_at"]
  }
}
