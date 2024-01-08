import Queue from 'bull'

import BasePushQueue from './base.js'

import CreatePushEventOptions from './models/CreatePushEventOptions.js'

export default class SamaNativePushQueue extends BasePushQueue {
  constructor(queueName, redisUrl) {
    super()
    this.queue = new Queue(queueName, redisUrl)
  }

  async createChatAlert(createChatAlertEventOptions) {
    const createPushEventOptions = new CreatePushEventOptions(
      createChatAlertEventOptions.senderID,
      createChatAlertEventOptions.payload,
      {
        account_id: createChatAlertEventOptions.account_id,
        application_id: createChatAlertEventOptions.application_id,
        user_ids: createChatAlertEventOptions.offlineUsersIDs
      }
    )

    const pushEvents = await this.buildPushEvents(createPushEventOptions)

    await this.addToQueue(pushEvents)
  }

  async createPushEvents(createPushEventOptions) {
    const pushEvents = await this.buildPushEvents(createPushEventOptions)

    await this.addToQueue(pushEvents)

    return pushEvents
  }

  async addToQueue(pushEvents) {
    const pushEventIds = pushEvents.map(pushEvent => pushEvent.params._id.toString())

    for (const pushEventId of pushEventIds) {
      await this.queue.add({ push_event_id: pushEventId })
    }

    return pushEventIds
  }
}
