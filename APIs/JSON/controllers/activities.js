import BaseJSONController from './base.js'

import { CONSTANTS as MAIN_CONSTANTS } from '@sama/constants/constants.js'

import { ACTIVE } from '@sama/store/session.js'
import { ACTIVITY } from '@sama/store/activity.js'

import User from '@sama/models/user.js'

import SessionRepository from '@sama/repositories/session_repository.js'

import activityManager from '@sama/services/activity_manager.js'

import Response from '@sama/networking/models/Response.js'

class LastActivitiesController extends BaseJSONController {
  constructor() {
    super()

    this.sessionRepository = new SessionRepository(ACTIVE)
  }

  async status_subscribe(ws, data) {
    const {
      id: requestId,
      user_last_activity_subscribe: { id: uId },
    } = data

    const currentUId = this.sessionRepository.getSessionUserId(ws)
    const obj = {}

    if (ACTIVITY.SUBSCRIBED_TO[currentUId]) {
      await activityManager.statusUnsubscribe(ws)
    }

    ACTIVITY.SUBSCRIBED_TO[currentUId] = uId

    if (!ACTIVITY.SUBSCRIBERS[uId]) {
      ACTIVITY.SUBSCRIBERS[uId] = {}
    }

    ACTIVITY.SUBSCRIBERS[uId][currentUId] = true

    const activeSessions = await this.sessionRepository.getUserNodeData(uId)
    if (activeSessions.length) {
      obj[uId] = MAIN_CONSTANTS.LAST_ACTIVITY_STATUS.ONLINE
    } else {
      const uLastActivity = await User.findOne({ _id: uId })
      obj[uId] = uLastActivity.params.recent_activity
    }

    return new Response().addBackMessage({ response: { id: requestId, last_activity: obj } })
  }

  async status_unsubscribe(ws, data) {
    const { id: requestId } = data
    
    await activityManager.statusUnsubscribe(ws)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }

  async get_user_status(ws, data) {
    const {
      id: requestId,
      user_last_activity: { ids: uIds },
    } = data
    const obj = {}

    const uLastActivities = await User.findAll({ _id: { $in: uIds } }, [
      '_id',
      'recent_activity',
    ])

    for (const user of uLastActivities) {
      const uId = user._id.toString()
      const isUserOnline = await this.sessionRepository.getUserNodeData(uId)
      obj[uId] = !!isUserOnline? MAIN_CONSTANTS.LAST_ACTIVITY_STATUS.ONLINE : user.recent_activity
    }

    return new Response().addBackMessage({ response: { id: requestId, last_activity: obj } })
  }
}

export default new LastActivitiesController()
