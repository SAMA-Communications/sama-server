class ActivityUserUnsubscribeOperation {
  constructor(sessionService, activityManagerService) {
    this.sessionService = sessionService
    this.activityManagerService = activityManagerService
  }

  async perform(ws) {
    const currentUserId = this.sessionService.getSessionUserId(ws)

    await this.activityManagerService.unsubscribeObserver(currentUserId)
  }
}

export default ActivityUserUnsubscribeOperation
