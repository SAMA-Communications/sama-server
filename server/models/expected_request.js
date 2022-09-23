import BaseModel from "./base/base.js";

export default class ExpectedRequest extends BaseModel {
  constructor(params) {
    super(params);
  }

  static get collection() {
    return "expected_request";
  }

  static get visibleFields() {
    return ["_id", "created_at", "updated_at", "user_id", "requests"];
  }
}
