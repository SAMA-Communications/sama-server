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
      "user_id",
      "platform",
      "web_endpoint",
      "web_key_auth",
      "web_key_p256dh",
      "device_udid",
    ];
  }
}
