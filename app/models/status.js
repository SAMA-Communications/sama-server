import BaseModel from "./base/base.js";

export default class Status extends BaseModel {
  constructor(params) {
    super(params);
  }
  static get collection() {
    return "status";
  }

  static get visibleFields() {
    return ["_id", "created_at", "updated_at", "t", "type", "cid"];
  }
}
