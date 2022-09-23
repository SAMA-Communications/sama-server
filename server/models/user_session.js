import BaseModel from "./base/base.js";

export default class UserSession extends BaseModel {
  constructor(params) {
    super(params);
  }

  static get collection() {
    return "users_sessions";
  }

  static get visibleFields() {
    return ["_id", "user_id", "created_at", "updated_at"];
  }
}
