import BaseModel from "./base/base.js";

export default class Messages extends BaseModel {
  static get collection() {
    return "messages";
  }

  static get visibleFields() {
    return ["id", "t", "to", "from", "body", "cid", "x", "deleted_for"];
  }
}
