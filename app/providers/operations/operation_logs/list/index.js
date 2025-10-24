class OpLogsListOperation {
  constructor(sessionService, opLogsService) {
    this.sessionService = sessionService
    this.opLogsService = opLogsService
  }

  async perform(ws, opLogListOptions) {
    const { created_at } = opLogListOptions

    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const opLogs = await this.opLogsService.list(currentUserId, created_at)

    return opLogs
  }
}

export default OpLogsListOperation
