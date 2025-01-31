import BaseModel from "./base.js"

export default class PushSubscription extends BaseModel {
  static get collection() {
    return "push_subscriptions"
  }

  static get visibleFields() {
    return [
      "_id",

      "user_id",
      "platform",
      "web_endpoint",
      "web_key_auth",
      "web_key_p256dh",
      "device_udid",
      "device_token",

      "created_at",
      "updated_at",
    ]
  }
}
