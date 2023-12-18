import BaseJSONController from './base.js'

import { ERROR_STATUES } from '@sama/constants/errors.js'
import { ACTIVE } from '@sama/store/session.js'
import User from '@sama/models/user.js'
import PushSubscription from '../models/push_subscription.js'
import SessionRepository from '@sama/repositories/session_repository.js'
import PushNotificationsRepository from '../repositories/push_notifications_repository.js'
import { ObjectId } from '@sama/lib/db.js'
import Response from '@sama/networking/models/Response.js'

class PushNotificationsController extends BaseJSONController {
  constructor() {
    super()

    this.sessionRepository = new SessionRepository(ACTIVE)
    this.pushNotificationsRepository = new PushNotificationsRepository()
  }

  async push_subscription_create(ws, data) {
    const {
      id: requestId,
      push_subscription_create: {
        platform,
        web_endpoint,
        web_key_auth,
        web_key_p256dh,
        device_udid,
      },
    } = data

    const userId = this.sessionRepository.getSessionUserId(ws)
    let pushSubscription = new PushSubscription(
      (
        await PushSubscription.findOneAndUpdate(
          { device_udid, user_id: userId },
          { $set: { web_endpoint, web_key_auth, web_key_p256dh } }
        )
      )?.value
    )

    if (!pushSubscription.params) {
      data.push_subscription_create['user_id'] = new ObjectId(userId)
      pushSubscription = new PushSubscription(data.push_subscription_create)
      await pushSubscription.save()
    }

    return new Response().addBackMessage({
      response: {
        id: requestId,
        subscription: pushSubscription.visibleParams(),
      },
    })
  }

  async push_subscription_list(ws, data) {
    const {
      id: requestId,
      push_subscription_list: { user_id },
    } = data

    const subscriptions = await PushSubscription.findAll({ user_id })

    return new Response().addBackMessage({ response: { id: requestId, subscriptions } })
  }

  async push_subscription_delete(ws, data) {
    const {
      id: requestId,
      push_subscription_delete: { device_udid },
    } = data

    const userId = this.sessionRepository.getSessionUserId(ws)
    const pushSubscriptionRecord = await PushSubscription.findOne({
      device_udid,
      user_id: userId,
    })
    if (!pushSubscriptionRecord) {
      throw new Error(ERROR_STATUES.NOTIFICATION_NOT_FOUND.message, {
        cause: ERROR_STATUES.NOTIFICATION_NOT_FOUND,
      })
    }

    await pushSubscriptionRecord.delete()

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }

  async push_event_create(ws, data) {
    const {
      id: requestId,
      push_event_create: { recipients_ids, message },
    } = data

    const recipients = []

    for (const id of recipients_ids) {
      const u = await User.findOne({ _id: id })
      !!u && recipients.push(id)
    }

    if (!recipients.length) {
      throw new Error(ERROR_STATUES.RECIPIENTS_NOT_FOUND.message, {
        cause: ERROR_STATUES.RECIPIENTS_NOT_FOUND,
      })
    }

    const userId = this.sessionRepository.getSessionUserId(ws)
    const pushEvent = await this.pushNotificationsRepository.createPushEvent(
      recipients,
      userId,
      message
    )

    return new Response().addBackMessage({ response: { id: requestId, event: pushEvent } })
  }
}

export default new PushNotificationsController()
