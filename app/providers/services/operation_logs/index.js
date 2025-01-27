class OperationLogsService {
  constructor(opLogsRepo) {
    this.opLogsRepo = opLogsRepo
  }

  async savePacket(user_id, packet) {
    const opLog = await this.opLogsRepo.create({ user_id, packet })

    return opLog
  }

  async list(userId, createdAt) {
    const opLogs = await this.opLogsRepo.list(userId, createdAt)

    return opLogs
  }
}

export default OperationLogsService
