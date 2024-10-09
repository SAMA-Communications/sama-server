class OperationLogLogsOperation {
  constructor(operationLogRepo, sessionService) {
    this.operationLogRepo = operationLogRepo
    this.sessionService = sessionService
  }

  async perform(ws, opLogParams) {
    const {
      created_at: { gt, lt },
    } = opLogParams

    const currentUserId = this.sessionService.getSessionUserId(ws)

    const query = {
      user_id: currentUserId,
      created_at: gt ? { $gt: new Date(gt) } : { $lt: new Date(lt || Date.now()) },
    }

    const opLogs = await this.operationLogRepo.findAll(query, ["user_id", "packet"])

    return opLogs
  }
}

export default OperationLogLogsOperation
