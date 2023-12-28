import OpLog from '../models/operations_log.js'
import BaseRepository from './base.js'

export default class OperationsLogRepository extends BaseRepository {
  constructor(model) {
    super(model, null)
  }

  savePacket(user_id, packet) {
    const record = new OpLog({ user_id, packet })
    record.save()
  }
}
