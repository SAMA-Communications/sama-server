import CreatePushEventOptions from "@sama/lib/push_queue/models/CreatePushEventOptions.js"

class PushNotificationService {
  constructor(RuntimeDefinedContext, pushEventRepo, pushSubscriptionsRepo) {
    this.RuntimeDefinedContext = RuntimeDefinedContext
    this.pushEventRepo = pushEventRepo
    this.pushSubscriptionsRepo = pushSubscriptionsRepo
  }

  async findSubscription(userId, deviceId) {
    const subscription = await this.pushSubscriptionsRepo.findUserSubscription(userId, deviceId)

    return subscription
  }

  async upsertSubscription(userId, deviceId, updateParams) {
    let subscription = await this.pushSubscriptionsRepo.findAndUpdate(userId, deviceId, updateParams)

    if (!subscription) {
      subscription = await this.pushSubscriptionsRepo.create(
        Object.assign({}, { user_id: userId, device_udid: deviceId }, updateParams)
      )
    }

    return subscription
  }

  async listSubscriptions(userId) {
    const subscriptions = await this.pushSubscriptionsRepo.findAll({ user_id: userId })

    return subscriptions
  }

  async findAndDeleteSubscription(userId, deviceId) {
    const subscription = await this.findSubscription(userId, deviceId)

    if (subscription) {
      await this.pushSubscriptionsRepo.deleteById(subscription._id)
    }

    return subscription
  }

  async createEvent(organizationId, userId, recipientIds, message) {
    const createPushEventOptions = new CreatePushEventOptions(userId, message, {
      user_ids: recipientIds,
    })

    const pushEvent = await this.RuntimeDefinedContext.PUSH_QUEUE_DRIVER.createPushEvent(createPushEventOptions)

    return pushEvent
  }
}

export default PushNotificationService
