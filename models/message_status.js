import BaseModel from "./base/base.js";

export default class MessageStatus extends BaseModel {
  constructor(params) {
    super(params);
  }

  static get collection() {
    return "message_status";
  }

  static get visibleFields() {
    return ["_id", "cid", "mid", "user_id", "created_at", "status"];
  }
}
x;
