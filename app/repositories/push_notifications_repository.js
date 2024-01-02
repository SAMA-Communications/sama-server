import BaseRepository from './base.js'

import PushEvent from '../models/push_event.js'
import PushSubscription from '../models/push_subscription.js'

import pushNotificationQueue from '../lib/push_queue.js'

class PushNotificationsRepository extends BaseRepository {
  constructor(PushEventModel, PushSubscriptionModel) {
    super(PushEventModel)

    this.PushSubscriptionModel = PushSubscriptionModel
  }

  async addPushNotificationToQueue(users_ids, message) {
    let devices = {}

    for (const id of users_ids) {
      const userDevices = await this.PushSubscriptionModel.findAll({ user_id: id })
      if (!userDevices.length) {
        continue
      }
      devices[id] = userDevices
    }

    if (!Object.keys(devices).length) {
      return
    }

    const data = { devices, message }
    await pushNotificationQueue.add(data)
  }

  async createPushEvent(recipients_ids, user_id, message) {
    const pushMessage = message
    const pushEventParams = {
      user_id,
      recipients_ids,
      message: JSON.stringify(pushMessage),
    }

    const pushEvent = new this.Model(pushEventParams)
    await pushEvent.save()

    await this.addPushNotificationToQueue(recipients_ids, pushMessage)

    return pushEvent.visibleParams()
  }
}

export default new PushNotificationsRepository(PushEvent, PushSubscription)
