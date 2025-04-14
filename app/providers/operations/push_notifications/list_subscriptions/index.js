class PushSubscriptionListOperation {
  constructor(sessionService, pushNotificationService) {
    this.sessionService = sessionService
    this.pushNotificationService = pushNotificationService
  }

  async perform(ws, queryParams) {
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const pushSubscriptions = await this.pushNotificationService.listSubscriptions(currentUserId)

    return pushSubscriptions
  }
}

export default PushSubscriptionListOperation
