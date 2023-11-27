import User from '../models/user.js'
import { ACTIVE } from '../store/session.js'
import { ACTIVITY } from '../store/activity.js'
import SessionRepository from '../repositories/session_repository.js'

class ActivityManager {
  constructor() {
    this.sessionRepository = new SessionRepository(ACTIVE)
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

  async maybeUpdateAndSendUserActivity(ws, { uId, rId }, status) {
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

    const message = { last_activity: { [uId]: status || currentTime } }
    const subscriptions = Object.keys(ACTIVITY.SUBSCRIBERS[uId])

    return { subscriptions, message }
  }
}

export default new ActivityManager()
