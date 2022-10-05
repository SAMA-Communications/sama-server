import BaseModel from "./base/base.js";

export default class OfflineQueue extends BaseModel {
  constructor(params) {
    super(params);
  }

  static get collection() {
    return "offline_queue";
  }

  static get visibleFields() {
    return ["_id", "created_at", "updated_at", "user_id", "request"];
  }
}
