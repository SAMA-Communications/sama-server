import BaseService from './base.js'

import { CONSTANTS as MAIN_CONSTANTS } from '../constants/constants.js'

import { ACTIVITY } from '../store/activity.js'

import User from '../models/user.js'

import sessionRepository from '../repositories/session_repository.js'

class ActivityManager extends BaseService {
  async statusUnsubscribe(ws, userId) {
    const currentUId = sessionRepository.getSessionUserId(ws) || userId

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

    if (status !== MAIN_CONSTANTS.LAST_ACTIVITY_STATUS.ONLINE) {
      await User.updateOne(
        { _id: userId },
        { $set: { recent_activity: currentTime } }
      )
      await this.statusUnsubscribe(ws, userId)
    }

    const subscriptions = Object.keys(ACTIVITY.SUBSCRIBERS[userId])

    return { subscriptions, last_activity: { userId: userId, timestamp: currentTime, status } }
  }
}

export default new ActivityManager()
