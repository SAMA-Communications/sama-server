import { CONSTANTS as MAIN_CONSTANTS } from "../../../../constants/constants.js"

/*
  Structs:
  HSET - sama:subscribed_to -> [observerId] - targetId
  HSET - sama:subscribers -> [targetId] -> observerId1,observerId2,observerId3
*/

const SUBSCRIBED_TO_KEY = "sama:subscribed_to"
const SUBSCRIBERS_KEY = "sama:subscribers"

class ActivityManagerClusterService {
  constructor(redisConnection, userService) {
    this.redisConnection = redisConnection
    this.userService = userService
  }

  serializeUserId(userId) {
    return `${userId}`
  }

  deserializeUserId(userId) {
    return userId && `${userId}`
  }

  // observer - targets relations
  async subscribeTarget(observerId) {
    const targetId = await this.redisConnection.client.hGet(SUBSCRIBED_TO_KEY, this.serializeUserId(observerId))

    return targetId ? this.deserializeUserId(targetId) : void 0
  }

  async addSubscribeTarget(observerId, targetId) {
    await this.redisConnection.client.hSet(SUBSCRIBED_TO_KEY, this.serializeUserId(observerId), this.serializeUserId(targetId))
  }

  async deleteSubscribeTarget(observerId, targetId) {
    await this.redisConnection.client.hDel(SUBSCRIBED_TO_KEY, this.serializeUserId(observerId))
  }

  async clearAllSubscriptionTargets(observerId) {
    await this.redisConnection.client.hDel(SUBSCRIBED_TO_KEY, this.serializeUserId(observerId))
  }

  // target - observer relations
  async subscribers(targetId) {
    const observersIds = await this.redisConnection.client.hGet(SUBSCRIBERS_KEY, this.serializeUserId(targetId))

    return observersIds ? observersIds.split(",").map((userId) => this.deserializeUserId(userId)) : []
  }

  async addSubscriber(targetId, observerId) {
    const observersIdsArr = await this.subscribers(targetId)

    const observersIds = new Set(observersIdsArr)

    observersIds.add(this.deserializeUserId(observerId))

    const newObserversIds = Array.from(observersIds).join(",")

    await this.redisConnection.client.hSet(SUBSCRIBERS_KEY, this.serializeUserId(targetId), newObserversIds)
  }

  async deleteSubscriber(targetId, observerId) {
    const observersIdsArr = await this.subscribers(targetId)

    const observersIds = new Set(observersIdsArr)

    observersIds.delete(this.deserializeUserId(observerId))

    if (!observersIds.size) {
      await this.clearSubscribed(targetId)
      return
    }

    const newObserversIds = Array.from(observersIds).join(",")

    await this.redisConnection.client.hSet(SUBSCRIBERS_KEY, this.serializeUserId(targetId), newObserversIds)
  }

  async clearSubscribed(targetId) {
    await this.redisConnection.client.hDel(SUBSCRIBERS_KEY, this.serializeUserId(targetId))
  }

  async subscribeObserverToTarget(observerId, targetId) {
    await this.unsubscribeObserver(observerId)

    await this.addSubscribeTarget(observerId, targetId)
    await this.addSubscriber(targetId, observerId)
  }

  async unsubscribeObserver(observerId) {
    const targetId = await this.subscribeTarget(observerId)

    await this.deleteSubscribeTarget(observerId)

    if (targetId) {
      await this.deleteSubscriber(targetId, observerId)
    }
  }

  async updateUserActivity(userId, status) {
    const currentTime = Math.round(new Date() / 1000)

    if (status !== MAIN_CONSTANTS.LAST_ACTIVITY_STATUS.ONLINE) {
      await this.userService.updateActivity(userId, currentTime)

      await this.unsubscribeObserver(userId)
    }

    const activitySubscribers = await this.subscribers(userId)

    if (!activitySubscribers.length) {
      return
    }

    return {
      subscribers: activitySubscribers,
      targetUserId: userId,
      activityStatus: { timestamp: currentTime, status },
    }
  }
}

export default ActivityManagerClusterService
