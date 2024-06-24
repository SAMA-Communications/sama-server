import BaseRepository from "./base.js"

import OpLog from "../models/operations_log.js"

class OperationsLogRepository extends BaseRepository {
  async savePacket(user_id, packet) {
    const record = new this.Model({ user_id, packet })
    await record.save()
  }
}

export default new OperationsLogRepository(OpLog)
