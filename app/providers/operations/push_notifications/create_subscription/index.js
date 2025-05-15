class PushSubscriptionCreateOperation {
  constructor(sessionService, pushNotificationService) {
    this.sessionService = sessionService
    this.pushNotificationService = pushNotificationService
  }

  async perform(ws, createSubscriptionParams) {
    const { device_udid } = createSubscriptionParams

    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const upsertSubscription = await this.pushNotificationService.upsertSubscription(
      currentUserId,
      device_udid,
      Object.assign(createSubscriptionParams, { organization_id: organizationId })
    )

    return upsertSubscription
  }
}

export default PushSubscriptionCreateOperation
