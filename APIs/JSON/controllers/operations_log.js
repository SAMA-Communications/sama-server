import BaseJSONController from './base.js'

import { ACTIVE } from '@sama/store/session.js'
import OpLog from '@sama/models/operations_log.js'
import SessionRepository from '@sama/repositories/session_repository.js'
import Response from '@sama/networking/models/Response.js'

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
    // TODO: map logs from api to api
    const opLogs = await OpLog.findAll(query, ['user_id', 'packet'])

    return new Response().addBackMessage({ response: { id: requestId, logs: opLogs } })
  }
}

export default new OperationsLogController()
