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

    const pushEvents = await this.buildPushEvents(createPushEventOptions)

    await this.#addToQueue(pushEvents)
  }

  async createPushEvents(createPushEventOptions) {
    const pushEvents = await this.buildPushEvents(createPushEventOptions)

    await this.#addToQueue(pushEvents)

    return pushEvents
  }

  async #addToQueue(pushEvents) {
    for (const pushEvent of pushEvents) {
      let devices = []
      const platform = pushEvent.params.platform

      for (const uid of pushEvent.params.user_ids) {
        const userDevices = await this.getUserDevicesByPlatform(platform, uid)
        if (!userDevices.length) continue
        devices = devices.concat(userDevices)
      }

      if (!Object.keys(devices).length) continue

      const data = { devices, message: pushEvent.params.message, platform }
      await this.queue.add(data)
    }
  }
}
