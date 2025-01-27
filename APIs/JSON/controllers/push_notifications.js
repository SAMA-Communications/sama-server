import BaseJSONController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import Response from "@sama/networking/models/Response.js"

class PushNotificationsController extends BaseJSONController {
  async push_subscription_create(ws, data) {
    const { id: requestId, push_subscription_create } = data

    const pushSubscriptionCreateOperation = ServiceLocatorContainer.use("PushSubscriptionCreateOperation")

    const pushSubscription = await pushSubscriptionCreateOperation.perform(ws, push_subscription_create)

    return new Response().addBackMessage({
      response: {
        id: requestId,
        subscription: pushSubscription.visibleParams(),
      },
    })
  }

  async push_subscription_list(ws, data) {
    const { id: requestId } = data

    const pushSubscriptionListOperation = ServiceLocatorContainer.use("PushSubscriptionListOperation")

    const subscriptions = await pushSubscriptionListOperation.perform(ws, {})

    return new Response().addBackMessage({ response: { id: requestId, subscriptions } })
  }

  async push_subscription_delete(ws, data) {
    const { id: requestId, push_subscription_delete } = data

    const pushSubscriptionDeleteOperation = ServiceLocatorContainer.use("PushSubscriptionDeleteOperation")

    await pushSubscriptionDeleteOperation.perform(ws, push_subscription_delete)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }

  async push_event_create(ws, data) {
    const { id: requestId, push_event_create } = data

    const pushEventCreateOperation = ServiceLocatorContainer.use("PushEventCreateOperation")

    const pushEvent = await pushEventCreateOperation.perform(ws, push_event_create)

    return new Response().addBackMessage({ response: { id: requestId, event: pushEvent.visibleParams() } })
  }
}

export default new PushNotificationsController()
