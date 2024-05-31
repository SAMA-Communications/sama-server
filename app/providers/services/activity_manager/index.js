import { CONSTANTS as MAIN_CONSTANTS } from "../../../constants/constants.js"

class ActivityManagerService {
  constructor(ACTIVITY, userService) {
    this.ACTIVITY = ACTIVITY
    this.userService = userService
  }

  // observer - targets relations
  subscribeTarget(observerId) {
    return this.ACTIVITY.SUBSCRIBED_TO[observerId]
  }

  addSubscribeTarget(observerId, targetId) {
    this.ACTIVITY.SUBSCRIBED_TO[observerId] = targetId
  }

  deleteSubscribeTarget(observerId, targetId) {
    delete this.ACTIVITY.SUBSCRIBED_TO[observerId]
  }

  clearAllSubscriptionTargets(observerId) {
    delete this.ACTIVITY.SUBSCRIBED_TO[observerId]
  }

  // target - observer relations
  subscribers(targetId) {
    return this.ACTIVITY.SUBSCRIBERS[targetId] || {}
  }

  addSubscriber(targetId, observerId) {
    if (!this.ACTIVITY.SUBSCRIBERS[targetId]) {
      this.ACTIVITY.SUBSCRIBERS[targetId] = {}
    }

    this.ACTIVITY.SUBSCRIBERS[targetId][observerId] = true
  }

  deleteSubscriber(targetId, observerId) {
    if (this.ACTIVITY.SUBSCRIBERS[targetId]) {
      delete this.ACTIVITY.SUBSCRIBERS[targetId][observerId]
    }
  }

  clearSubscribed(targetId) {
    this.ACTIVITY.SUBSCRIBERS[targetId] = {}
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
