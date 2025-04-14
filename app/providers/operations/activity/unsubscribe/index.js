class ActivityUserUnsubscribeOperation {
  constructor(sessionService, activityManagerService) {
    this.sessionService = sessionService
    this.activityManagerService = activityManagerService
  }

  async perform(ws) {
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    await this.activityManagerService.unsubscribeObserver(currentUserId)
  }
}

export default ActivityUserUnsubscribeOperation
