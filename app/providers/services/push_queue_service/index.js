import Queue from "bull"

import BasePushQueueService from "./base.js"

import CreatePushEventOptions from "./models/CreatePushEventOptions.js"

export default class PushQueueService extends BasePushQueueService {
  #queue = null

  constructor(config, pushEventRepo, pushSubscriptionsRepo) {
    super()

    this.config = config
    this.#queue = new Queue(config.get("push.queueName"), config.get("redis.main.url"))

    this.pushEventRepo = pushEventRepo
    this.pushSubscriptionsRepo = pushSubscriptionsRepo
  }

  async #buildPushEvent(createPushEventOptions) {
    const pushEvent = await this.pushEventRepo.create(createPushEventOptions)

    return pushEvent
  }

  async #getSubscriptionsByUid(user_id) {
    const devices = await this.pushSubscriptionsRepo.findAll({ user_id: user_id })

    return devices
  }

  async createChatAlert(createChatAlertEventOptions) {
    const createPushEventOptions = new CreatePushEventOptions(createChatAlertEventOptions.senderID, createChatAlertEventOptions.payload, {
      user_ids: createChatAlertEventOptions.offlineUsersIDs,
    })

    const pushEvent = await this.createPushEvent(createPushEventOptions)

    return pushEvent
  }

  async createPushEvent(createPushEventOptions) {
    const pushEvents = await this.#buildPushEvent(createPushEventOptions)

    await this.#addToQueue(pushEvents)

    return pushEvents
  }

  async #addToQueue(pushEvent) {
    let devices = []

    for (const uid of pushEvent.params.user_ids) {
      const userDevices = await this.#getSubscriptionsByUid(uid)
      if (!userDevices.length) continue
      devices = devices.concat(userDevices)
    }

    if (!Object.keys(devices).length) return

    const data = { devices, message: pushEvent.params.message }
    await this.#queue.add(data)
  }
}
