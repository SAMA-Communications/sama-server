import { APIs } from '../networking/APIs.js'

import ServiceLocatorContainer from '../common/ServiceLocatorContainer.js'

import DeliverMessage from '@sama/networking/models/DeliverMessage.js'
import Response from '@sama/networking/models/Response.js'

class ActivitySender {
  detectSocketAPI(ws) {
    const api = APIs[ws.apiType]
    return api
  }

  async updateAndSendUserActivity(ws, userId, status) {
    const activityManagerService = ServiceLocatorContainer.use('ActivityManagerService')

    const deliver = await activityManagerService.updateUserActivity(userId, status)

    const responses = []

    if (!deliver) {
      return responses
    }

    const api = this.detectSocketAPI(ws)

    for (const subscriberUserId of deliver.subscribers) {
      const lastActivityMessage = await api.buildLastActivityPackage(
        subscriberUserId,
        deliver.targetUserId,
        {
          timestamp: deliver.activityStatus.timestamp,
          status: deliver.activityStatus.status,
        }
      )

      const response = new Response().addDeliverMessage(new DeliverMessage([subscriberUserId], lastActivityMessage, true))

      responses.push(response)
    }

    return responses
  }
}

export default new ActivitySender()
