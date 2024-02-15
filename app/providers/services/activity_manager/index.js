import { CONSTANTS as MAIN_CONSTANTS } from '../../../constants/constants.js'
import { ACTIVITY } from '../../../store/activity.js'

class ActivityManagerService {
  constructor(userService) {
    this.userService = userService
  }

  // observer - targets relations
  subscribeTarget(observerId) {
    return ACTIVITY.SUBSCRIBED_TO[observerId]
  }

  addSubscribeTarget(observerId, targetId) {
    ACTIVITY.SUBSCRIBED_TO[observerId] = targetId
  }

  deleteSubscribeTarget(observerId, targetId) {
    delete ACTIVITY.SUBSCRIBED_TO[observerId]
  }

  clearAllSubscriptionTargets(observerId) {
    delete ACTIVITY.SUBSCRIBED_TO[observerId]
  }

  // target - observer relations
  subscribers(targetId) {
    return ACTIVITY.SUBSCRIBERS[targetId] || {}
  }

  addSubscriber(targetId, observerId) {
    if (!ACTIVITY.SUBSCRIBERS[targetId]) {
      ACTIVITY.SUBSCRIBERS[targetId] = {}
    }

    ACTIVITY.SUBSCRIBERS[targetId][observerId] = true
  }

  deleteSubscriber(targetId, observerId) {
    if (ACTIVITY.SUBSCRIBERS[targetId]) {
      delete ACTIVITY.SUBSCRIBERS[targetId][observerId]
    }
  }

  clearSubscribed(targetId) {
    ACTIVITY.SUBSCRIBERS[targetId] = {}
  }

  async subscribeObserverToTarget(observerId, targetId) {
    this.unsubscribeObserver(observerId)

    this.addSubscribeTarget(observerId, targetId)
    this.addSubscriber(targetId, observerId)
  }

  async unsubscribeObserver(observerId) {
    const targetId = this.subscribeTarget(observerId)

    this.deleteSubscribeTarget(observerId)
    this.deleteSubscriber(targetId, observerId)
  }

  async updateUserActivity(userId, status) {
    const currentTime = Math.round(new Date() / 1000)

    if (status !== MAIN_CONSTANTS.LAST_ACTIVITY_STATUS.ONLINE) {
      await this.userService.updateActivity(userId, currentTime)
      
      this.unsubscribeObserver(userId)
    }

    const activitySubscribers = Object.keys(this.subscribers(userId))

    if (!activitySubscribers.length) {
      return
    }

    return { subscriptions: activitySubscribers, last_activity: { userId: userId, timestamp: currentTime, status } }
  }
}

export default ActivityManagerService