class OpLogsListOperation {
  constructor(sessionService, opLogsService) {
    this.sessionService = sessionService
    this.opLogsService = opLogsService
  }

  async perform(ws, opLogListOptions) {
    const { created_at } = opLogListOptions

    const currentUserId = this.sessionService.getSessionUserId(ws)

    const opLogs = await this.opLogsService.list(currentUserId, created_at)

    return opLogs
  }
}

export default OpLogsListOperation
