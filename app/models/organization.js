import BaseModel from "./base.js"

export default class Organization extends BaseModel {
  static get collection() {
    return "organizations"
  }

  static get visibleFields() {
    return ["_id", "name", "created_at", "updated_at"]
  }
}
