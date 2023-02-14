import BaseModel from "./base/base.js";

export default class OpLog extends BaseModel {
  constructor(params) {
    super(params);
  }

  static get collection() {
    return "op_log";
  }

  static get visibleFields() {
    return ["_id", "created_at", "updated_at", "user_id", "request"];
  }
}
