import User from '../models/user.js'
import { ACTIVE } from '../store/session.js'
import { ACTIVITY } from '../store/activity.js'
import SessionRepository from '../repositories/session_repository.js'
import packetManager from './packet_manager.js'
import APIs from "./APIs.js"

class ActivityManager {
  constructor() {
    this.sessionRepository = new SessionRepository(ACTIVE)
  }

  detectSocketAPI(ws) {
    const api = APIs[ws.apiType]
    return api
  }

  async status_unsubscribe(ws) {
    const currentUId = this.sessionRepository.getSessionUserId(ws)

    const oldTrackerUserId = ACTIVITY.SUBSCRIBED_TO[currentUId]
    const oldUserSubscribers = ACTIVITY.SUBSCRIBERS[oldTrackerUserId]
    delete ACTIVITY.SUBSCRIBED_TO[currentUId]

    if (oldUserSubscribers) {
      if (Object.keys(oldUserSubscribers).length <= 1) {
        delete ACTIVITY.SUBSCRIBERS[oldTrackerUserId]
      } else if (oldUserSubscribers[currentUId]) {
        delete ACTIVITY.SUBSCRIBERS[oldTrackerUserId][currentUId]
      }
    }
  }

  async updateUserActivity(ws, { uId, rId }, status) {
    if (!ACTIVITY.SUBSCRIBERS[uId]) {
      return
    }

    const currentTime = Math.round(new Date() / 1000)

    if (status !== 'online') {
      await User.updateOne(
        { _id: uId },
        { $set: { recent_activity: currentTime } }
      )
      await this.status_unsubscribe(ws)
    }

    const subscriptions = Object.keys(ACTIVITY.SUBSCRIBERS[uId])

    return { subscriptions, last_activity: { userId: uId, timestamp: currentTime, status } }
  }

  async updateAndSendUserActivity(ws, ids, status) {
    const deliver = await this.updateUserActivity(ws, ids, status)
    if (!deliver) {
      return
    }

    const api = this.detectSocketAPI(ws)
    const message = api.buildLastActivityPackage(
      deliver.last_activity.userId,
      deliver.last_activity.timestamp,
      deliver.last_activity.status
    )

    for (const uId of deliver.subscriptions) {
      await packetManager.deliverToUserOnThisNode(ws, uId, message)
    }
  }
}

export default new ActivityManager()
