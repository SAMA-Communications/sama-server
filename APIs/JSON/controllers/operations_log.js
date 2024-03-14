import BaseJSONController from './base.js'

import OpLog from '@sama/models/operations_log.js'

import ServiceLocatorContainer from '@sama/common/ServiceLocatorContainer.js'

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
  async logs(ws, data) {
    const {
      id: requestId,
      op_log_list: {
        created_at: { gt, lt },
      },
    } = data

    const sessionService = ServiceLocatorContainer.use('SessionService')

    const currentUserId = sessionService.getSessionUserId(ws)

    const query = {
      user_id: currentUserId,
      created_at: gt ? { $gt: new Date(gt) } : { $lt: new Date(lt) },
    }

    const opLogs = await OpLog.findAll(query, ['user_id', 'packet'])
    const packet = { response: { id: requestId, logs: opLogs } }

    return new Response().addBackMessage(new MappableMessage(packet, mapOpLogsMessage))
  }
}

export default new OperationsLogController()
