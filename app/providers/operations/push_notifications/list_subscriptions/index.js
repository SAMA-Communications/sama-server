class PushSubscriptionListOperation {
  constructor(sessionService, pushNotificationService) {
    this.sessionService = sessionService
    this.pushNotificationService = pushNotificationService
  }

  async perform(ws, queryParams) {
    const currentUserId = this.sessionService.getSessionUserId(ws)

    const pushSubscriptions = await this.pushNotificationService.listSubscriptions(currentUserId)

    return pushSubscriptions
  }
}

export default PushSubscriptionListOperation
