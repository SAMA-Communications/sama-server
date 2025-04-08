import CreateChatAlertEventOptions from "./models/CreateChatAlertEventOptions.js"
import CreatePushEventOptions from "./models/CreatePushEventOptions.js"

export default class BasePushQueueService {
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
