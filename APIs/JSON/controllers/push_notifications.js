import BaseJSONController from "./base.js"

import { ERROR_STATUES } from "@sama/constants/errors.js"

import RuntimeDefinedContext from "@sama/store/RuntimeDefinedContext.js"
import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import PushSubscription from "@sama/models/push_subscription.js"

import { ObjectId } from "@sama/lib/db.js"

import Response from "@sama/networking/models/Response.js"
import CreatePushEventOptions from "@sama/lib/push_queue/models/CreatePushEventOptions.js"

class PushNotificationsController extends BaseJSONController {
  async push_subscription_create(ws, data) {
    const {
      id: requestId,
      push_subscription_create: { web_endpoint, web_key_auth, web_key_p256dh, device_token, device_udid },
    } = data

    const sessionService = ServiceLocatorContainer.use("SessionService")

    const userId = sessionService.getSessionUserId(ws)
    let pushSubscription = new PushSubscription(
      (
        await PushSubscription.findOneAndUpdate(
          { user_id: userId, device_udid },
          { $set: { web_endpoint, web_key_auth, web_key_p256dh, device_token } }
        )
      )?.value
    )

    if (!pushSubscription.params) {
      data.push_subscription_create["user_id"] = new ObjectId(userId)
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

    const sessionService = ServiceLocatorContainer.use("SessionService")

    const userId = sessionService.getSessionUserId(ws)
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

    const userService = ServiceLocatorContainer.use("UserService")

    const recipients = await userService.userRepo.retrieveExistedIds(recipients_ids)

    if (!recipients.length) {
      throw new Error(ERROR_STATUES.RECIPIENTS_NOT_FOUND.message, {
        cause: ERROR_STATUES.RECIPIENTS_NOT_FOUND,
      })
    }

    const sessionService = ServiceLocatorContainer.use("SessionService")

    const userId = sessionService.getSessionUserId(ws)

    const createPushEventOptions = new CreatePushEventOptions(userId, message, {
      user_ids: recipients_ids,
    })

    const pushEvents = await RuntimeDefinedContext.PUSH_QUEUE_DRIVER.createPushEvents(createPushEventOptions)

    const responsePushEvents = pushEvents.map((pushEvent) => pushEvent.visibleParams())

    return new Response().addBackMessage({ response: { id: requestId, event: responsePushEvents } })
  }
}

export default new PushNotificationsController()
