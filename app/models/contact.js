import BaseModel from "./base/base.js";

export default class Contact extends BaseModel {
  constructor(params) {
    super(params);
  }

  static get collection() {
    return "contacts";
  }

  static get visibleFields() {
    return [
      "_id",
      "first_name",
      "last_name",
      "company",
      "user_id",
      "email",
      "phone",
      "created_at",
      "updated_at",
    ];
  }
}
