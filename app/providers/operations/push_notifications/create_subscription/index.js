class PushSubscriptionCreateOperation {
  constructor(sessionService, pushNotificationService) {
    this.sessionService = sessionService
    this.pushNotificationService = pushNotificationService
  }

  async perform(ws, createSubscriptionParams) {
    const { device_udid } = createSubscriptionParams

    const currentUserId = this.sessionService.getSessionUserId(ws)

    const upsertSubscription = await this.pushNotificationService.upsertSubscription(
      currentUserId,
      device_udid,
      createSubscriptionParams
    )

    return upsertSubscription
  }
}

export default PushSubscriptionCreateOperation
