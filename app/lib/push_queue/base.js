import pushNotificationsRepository from "../../repositories/push_notifications_repository.js"

import CreateChatAlertEventOptions from "./models/CreateChatAlertEventOptions.js"
import CreatePushEventOptions from "./models/CreatePushEventOptions.js"

export default class BasePushQueue {
  async buildPushEvent(createPushEventOptions) {
    const pushEvent = await pushNotificationsRepository.createPushEvent(
      createPushEventOptions.user_id,
      createPushEventOptions.user_ids,
      createPushEventOptions.payload,
      {}
    )

    return pushEvent
  }

  async getSubscriptionsByUid(user_id) {
    return await pushNotificationsRepository.getSubscriptionsByUid(user_id)
  }

  async createPush(pushQueueMessage) {
    if (pushQueueMessage instanceof CreateChatAlertEventOptions) {
      return await this.createChatAlert(pushQueueMessage)
    } else if (pushQueueMessage instanceof CreatePushEventOptions) {
      return await this.createPushEvent(pushQueueMessage)
    }

    throw new Error("Unknown push message type")
  }

  async createChatAlert() {
    throw new Error("Not implemented")
  }

  async createPushEvent() {
    throw new Error("Not implemented")
  }
}
