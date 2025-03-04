import { ERROR_STATUES } from "../../../../constants/errors.js"

class PushSubscriptionDeleteOperation {
  constructor(sessionService, pushNotificationService) {
    this.sessionService = sessionService
    this.pushNotificationService = pushNotificationService
  }

  async perform(ws, createSubscriptionParams) {
    const { device_udid } = createSubscriptionParams

    const currentUserId = this.sessionService.getSessionUserId(ws)

    const subscription = await this.pushNotificationService.findAndDeleteSubscription(currentUserId, device_udid)

    if (!subscription) {
      throw new Error(ERROR_STATUES.NOTIFICATION_NOT_FOUND.message, {
        cause: ERROR_STATUES.NOTIFICATION_NOT_FOUND,
      })
    }
  }
}

export default PushSubscriptionDeleteOperation
