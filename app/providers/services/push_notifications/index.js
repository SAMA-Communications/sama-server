import CreatePushEventOptions from "@sama/providers/services/push_queue_service/models/CreatePushEventOptions.js"

class PushNotificationService {
  constructor(pushEventRepo, pushSubscriptionsRepo, pushQueueService) {
    this.pushEventRepo = pushEventRepo
    this.pushSubscriptionsRepo = pushSubscriptionsRepo
    this.pushQueueService = pushQueueService
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

    const pushEvent = await this.pushQueueService.createPushEvent(createPushEventOptions)

    return pushEvent
  }
}

export default PushNotificationService
