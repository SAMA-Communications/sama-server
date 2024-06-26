import BaseService from "./base.js"

import { APIs } from "../networking/APIs.js"

import packetManager from "../networking/packet_manager.js"
import ServiceLocatorContainer from "../common/ServiceLocatorContainer.js"

class ActivitySender extends BaseService {
  detectSocketAPI(ws) {
    const api = APIs[ws.apiType]
    return api
  }

  async updateAndSendUserActivity(ws, userId, status) {
    const activityManagerService = ServiceLocatorContainer.use("ActivityManagerService")

    const deliver = await activityManagerService.updateUserActivity(userId, status)

    if (!deliver) {
      return
    }

    const api = this.detectSocketAPI(ws)
    const message = api.buildLastActivityPackage(
      deliver.last_activity.userId,
      deliver.last_activity.timestamp,
      deliver.last_activity.status
    )

    for (const userId of deliver.subscriptions) {
      await packetManager.deliverToUserOnThisNode(ws, userId, message)
    }
  }
}

export default new ActivitySender()
