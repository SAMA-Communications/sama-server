import { CONSTANTS as MAIN_CONSTANTS } from "../../../constants/constants.js"

/*
  Structs:
  HSET - sama:subscribed_to -> [observerId] - targetId
  HSET - sama:subscribers -> [targetId] -> observerId1,observerId2,observerId3
*/

const SUBSCRIBED_TO_KEY = "sama:subscribed_to"
const SUBSCRIBERS_KEY = "sama:subscribers"

class ActivityClusterManagerService {
  constructor(redisConnection, userService) {
    this.redisConnection = redisConnection
    this.userService = userService
  }

  // observer - targets relations
  async subscribeTarget(observerId) {
    const targetId = await this.redisConnection.client.hGet(SUBSCRIBED_TO_KEY, `${observerId}`)

    return targetId ? +targetId : void 0
  }

  async addSubscribeTarget(observerId, targetId) {
    await this.redisConnection.client.hSet(SUBSCRIBED_TO_KEY, `${observerId}`, `${targetId}`)
  }

  async deleteSubscribeTarget(observerId, targetId) {
    await this.redisConnection.client.hDel(SUBSCRIBED_TO_KEY, `${observerId}`)
  }

  async clearAllSubscriptionTargets(observerId) {
    await this.redisConnection.client.hDel(SUBSCRIBED_TO_KEY, `${observerId}`)
  }

  // target - observer relations
  async subscribers(targetId) {
    const observersIds = await this.redisConnection.client.hGet(SUBSCRIBERS_KEY, `${targetId}`)

    return observersIds ? observersIds.split(',').map(observerId => +observerId) : []
  }

  async addSubscriber(targetId, observerId) {
    const observersIdsArr = await this.subscribers(targetId)

    const observersIds = new Set(observersIdsArr)

    observersIds.add(observerId)

    const newObserversIds = Array.from(observersIds).join(',')

    await this.redisConnection.client.hSet(SUBSCRIBERS_KEY, `${targetId}`, newObserversIds)
  }

  async deleteSubscriber(targetId, observerId) {
    const observersIdsArr = await this.subscribers(targetId)

    const observersIds = new Set(observersIdsArr)

    observersIds.delete(observerId)

    if (!observersIds.size) {
      await this.clearSubscribed(targetId)
      return
    }

    const newObserversIds = Array.from(observersIds).join(',')

    await this.redisConnection.client.hSet(SUBSCRIBERS_KEY, `${targetId}`, newObserversIds)
  }

  async clearSubscribed(targetId) {
    await this.redisConnection.client.hDel(SUBSCRIBERS_KEY, `${targetId}`)
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

export default ActivityClusterManagerService
