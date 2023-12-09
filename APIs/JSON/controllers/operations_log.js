import BaseJSONController from './base.js'

import OpLog from '@sama/models/operations_log.js'
import SessionRepository from '@sama/repositories/session_repository.js'
import { ACTIVE } from '@sama/store/session.js'
import packetMapper from '@sama/networking/packet_mapper.js'

class OperationsLogController extends BaseJSONController {
  constructor() {
    super()
    this.sessionRepository = new SessionRepository(ACTIVE)
  }

  async logs(ws, data) {
    const {
      id: requestId,
      op_log_list: {
        created_at: { gt, lt },
      },
    } = data

    let query = {
      user_id: this.sessionRepository.getSessionUserId(ws),
      created_at: gt ? { $gt: new Date(gt) } : { $lt: new Date(lt) },
    }

    const opLogs = await OpLog.findAll(query, ['user_id', 'packet'])

    for (const opLog of opLogs) {
      const mappedPacket = await packetMapper.mapPacket(null, ws.apiType, opLog.packet)
      opLog.packet = mappedPacket
    }

    return { response: { id: requestId, logs: opLogs } }
  }
}

export default new OperationsLogController()
