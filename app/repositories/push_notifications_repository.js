import BaseRepository from "./base.js"

import PushEvent from "../models/push_event.js"
import PushSubscription from "../models/push_subscription.js"

class PushNotificationsRepository extends BaseRepository {
  constructor(PushEventModel, PushSubscriptionModel) {
    super(PushEventModel)

    this.PushSubscriptionModel = PushSubscriptionModel
  }

  async getSubscriptionsByUid(user_id) {
    return await this.PushSubscriptionModel.findAll({ user_id }, [
      "platform",
      "web_endpoint",
      "web_key_auth",
      "web_key_p256dh",
      "device_token",
    ])
  }

  async createPushEvent(userId, userIds, payload, options) {
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64")

    const pushEventParams = {
      user_id: userId,
      user_ids: userIds,

      message: base64Payload,
    }
    const pushEvent = new this.Model(pushEventParams)
    await pushEvent.save()

    return pushEvent
  }
}

export default new PushNotificationsRepository(PushEvent, PushSubscription)
