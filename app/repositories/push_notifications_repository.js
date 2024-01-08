import BaseRepository from './base.js'

import PushEvent from '../models/push_event.js'
import PushSubscription from '../models/push_subscription.js'

class PushNotificationsRepository extends BaseRepository {
  constructor(PushEventModel, PushSubscriptionModel) {
    super(PushEventModel)

    this.PushSubscriptionModel = PushSubscriptionModel
  }

  async usersNotificationChannels(users_ids) {
    let notificationChannelIds = new Set()

    for (const user_id of users_ids) {
      let userSubscriptions = await this.PushSubscriptionModel.findAll({ user_id: user_id })

      userSubscriptions = userSubscriptions ?? []

      for (const subscription of userSubscriptions) {
        notificationChannelIds.add(subscription.platform)
      }
    }

    return [...notificationChannelIds]
  }

  async createPushEvents(userId, userIds, payload, options) {
    const notificationChannels = await this.usersNotificationChannels(userIds)

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64')

    const pushEvents = []

    const pushEventParams = {
      account_id: options.account_id,
      application_id: options.application_id,

      user_id: userId,
      user_ids: userIds,

      message: base64Payload,
    }

    for (const notificationChannelId of notificationChannels) {
      pushEventParams.notification_channel_id = notificationChannelId
     
      const pushEvent = new this.Model(pushEventParams)
      await pushEvent.save()

      pushEvents.push(pushEvent)
    }

    return pushEvents
  }
}

export default new PushNotificationsRepository(PushEvent, PushSubscription)
