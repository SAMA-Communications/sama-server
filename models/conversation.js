import BaseModel from "./base/base.js";

export default class Conversation extends BaseModel {
  constructor(params) {
    super(params);
  }

  static get collection() {
    return "conversations";
  }

  static get visibleFields() {
    return [
      "_id",
      "created_at",
      "updated_at",
      "name",
      "type",
      "description",
      "owner_id",
      "recipient",
    ];
  }
}