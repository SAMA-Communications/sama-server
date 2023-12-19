import BaseJSONController from './base.js'

import { ACTIVE } from '@sama/store/session.js'

import OpLog from '@sama/models/operations_log.js'

import SessionRepository from '@sama/repositories/session_repository.js'

import MappableMessage from '@sama/networking/models/MappableMessage.js'
import Response from '@sama/networking/models/Response.js'

const mapOpLogsMessage = async function (mapper) {
  const mappedLogs = []

  for (const opLog of this.packet.response.logs) {
    const mappedLog = await mapper(opLog)
    mappedLogs.push(mappedLog)
  }
  
  this.packet.response.logs = mappedLogs

  return this.packet
}

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

    const query = {
      user_id: this.sessionRepository.getSessionUserId(ws),
      created_at: gt ? { $gt: new Date(gt) } : { $lt: new Date(lt) },
    }

    const opLogs = await OpLog.findAll(query, ['user_id', 'packet'])
    const packet = { response: { id: requestId, logs: opLogs } }

    return new Response().addBackMessage(new MappableMessage(packet, mapOpLogsMessage))
  }
}

export default new OperationsLogController()
