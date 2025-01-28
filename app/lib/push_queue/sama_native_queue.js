import Queue from "bull"

import BasePushQueue from "./base.js"

import CreatePushEventOptions from "./models/CreatePushEventOptions.js"

export default class SamaNativePushQueue extends BasePushQueue {
  constructor(queueName, redisUrl) {
    super()
    this.queue = new Queue(queueName, redisUrl)
  }

  async createChatAlert(createChatAlertEventOptions) {
    const createPushEventOptions = new CreatePushEventOptions(
      createChatAlertEventOptions.senderID,
      createChatAlertEventOptions.payload,
      { user_ids: createChatAlertEventOptions.offlineUsersIDs }
    )

    const pushEvent = await this.buildPushEvent(createPushEventOptions)

    await this.#addToQueue(pushEvent)
  }

  async createPushEvent(createPushEventOptions) {
    const pushEvents = await this.buildPushEvent(createPushEventOptions)

    await this.#addToQueue(pushEvents)

    return pushEvents
  }

  async #addToQueue(pushEvent) {
    let devices = []

    for (const uid of pushEvent.params.user_ids) {
      const userDevices = await this.getSubscriptionsByUid(uid)
      if (!userDevices.length) continue
      devices = devices.concat(userDevices)
    }

    if (!Object.keys(devices).length) return

    const data = { devices, message: pushEvent.params.message }
    await this.queue.add(data)
  }
}
