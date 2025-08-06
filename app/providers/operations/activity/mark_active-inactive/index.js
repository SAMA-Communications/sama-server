class ActivityMarkActiveInactiveOperation {
  constructor(sessionService) {
    this.sessionService = sessionService
  }

  async perform(ws, isMarkInactive) {
    await this.sessionService.setSessionInactiveState(ws, isMarkInactive)
  }
}

export default ActivityMarkActiveInactiveOperation
