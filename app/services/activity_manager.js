import User from '../models/user.js'
import { ACTIVE } from '../store/session.js'
import { ACTIVITY } from '../store/activity.js'
import SessionRepository from '../repositories/session_repository.js'

class ActivityManager {
  constructor() {
    this.sessionRepository = new SessionRepository(ACTIVE)
  }

  async statusUnsubscribe(ws) {
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

  async updateUserActivity(ws, userId, status) {
    if (!ACTIVITY.SUBSCRIBERS[userId]) {
      return
    }

    const currentTime = Math.round(new Date() / 1000)

    if (status !== 'online') {
      await User.updateOne(
        { _id: userId },
        { $set: { recent_activity: currentTime } }
      )
      await this.statusUnsubscribe(ws)
    }

    const subscriptions = Object.keys(ACTIVITY.SUBSCRIBERS[userId])

    return { subscriptions, last_activity: { userId: userId, timestamp: currentTime, status } }
  }
}

export default new ActivityManager()
