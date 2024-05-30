import BaseRepository from "./base.js"

import PushEvent from "../models/push_event.js"
import PushSubscription from "../models/push_subscription.js"

class PushNotificationsRepository extends BaseRepository {
  constructor(PushEventModel, PushSubscriptionModel) {
    super(PushEventModel)

    this.PushSubscriptionModel = PushSubscriptionModel
  }

  async usersPlatforms(users_ids) {
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
    const platforms = await this.usersPlatforms(userIds)

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64")

    const pushEvents = []

    const pushEventParams = {
      user_id: userId,
      user_ids: userIds,

      message: base64Payload,
    }

    for (const platform of platforms) {
      pushEventParams.platform = platform

      const pushEvent = new this.Model(pushEventParams)
      await pushEvent.save()

      pushEvents.push(pushEvent)
    }

    return pushEvents
  }
}

export default new PushNotificationsRepository(PushEvent, PushSubscription)
