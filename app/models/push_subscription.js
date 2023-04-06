import BaseModel from "./base/base.js";

export default class PushSubscription extends BaseModel {
  constructor(params) {
    super(params);
  }
  static get collection() {
    return "push_subscriptions";
  }

  static get visibleFields() {
    return [
      "_id",
      "created_at",
      "updated_at",
      "platform",
      "push_token",
      "device_udid",
    ];
  }
}
