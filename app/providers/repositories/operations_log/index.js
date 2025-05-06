import BaseRepository from "../base.js"

class OperationsLogRepository extends BaseRepository {
  async prepareParams(params) {
    params.user_id = this.castUserId(params.user_id)

    return await super.prepareParams(params)
  }

  async list(userId, createdAt) {
    const query = {
      user_id: userId,
      created_at: createdAt.gt ? { $gt: new Date(createdAt.gt) } : { $lt: new Date(createdAt.lt) },
    }

    const opLogs = await this.findAll(query)

    return opLogs
  }
}

export default OperationsLogRepository
