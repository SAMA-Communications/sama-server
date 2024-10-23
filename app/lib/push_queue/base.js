import pushNotificationsRepository from "../../repositories/push_notifications_repository.js"

import CreateChatAlertEventOptions from "./models/CreateChatAlertEventOptions.js"
import CreatePushEventOptions from "./models/CreatePushEventOptions.js"

export default class BasePushQueue {
  async buildPushEvents(createPushEventOptions) {
    const pushEvents = await pushNotificationsRepository.createPushEvents(
      createPushEventOptions.user_id,
      createPushEventOptions.user_ids,
      createPushEventOptions.payload,
      {}
    )

    return pushEvents
  }

  async getSubscriptionsByPlatform(platform, user_id) {
    return await pushNotificationsRepository.getSubscriptionsByPlatform(platform, user_id)
  }

  async createPush(pushQueueMessage) {
    if (pushQueueMessage instanceof CreateChatAlertEventOptions) {
      return await this.createChatAlert(pushQueueMessage)
    } else if (pushQueueMessage instanceof CreatePushEventOptions) {
      return await this.createPushEvents(pushQueueMessage)
    }

    throw new Error("Unknown push message type")
  }

  async createChatAlert() {
    throw new Error("Not implemented")
  }

  async createPushEvents() {
    throw new Error("Not implemented")
  }
}
