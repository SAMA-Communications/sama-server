import BaseModel from "./base.js"

export default class Contact extends BaseModel {
  static get collection() {
    return "contacts"
  }

  static get visibleFields() {
    return ["_id", "organization_id", "first_name", "last_name", "company", "email", "phone", "created_at", "updated_at"]
  }
}
