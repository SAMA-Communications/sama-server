import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import CreateChatAlertEventOptions from "./models/CreateChatAlertEventOptions.js"
import CreatePushEventOptions from "./models/CreatePushEventOptions.js"

export default class BasePushQueue {
  async buildPushEvent(createPushEventOptions) {
    const pushEventRepository = ServiceLocatorContainer.use("PushEventRepository")

    const pushEvent = await pushEventRepository.create(createPushEventOptions)

    return pushEvent
  }

  async getSubscriptionsByUid(user_id) {
    const pushSubscriptionRepo = ServiceLocatorContainer.use("PushSubscriptionsRepository")

    return await pushSubscriptionRepo.findAll({ user_id: user_id })
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
