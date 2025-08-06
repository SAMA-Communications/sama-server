import BaseJSONController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import Response from "@sama/networking/models/Response.js"

class ActivitiesController extends BaseJSONController {
  async status_subscribe(ws, data) {
    const {
      id: requestId,
      user_last_activity_subscribe: { id: targetUserId },
    } = data

    const activityUserSubscribeOperation = ServiceLocatorContainer.use("ActivityUserSubscribeOperation")
    const targetUserActivity = await activityUserSubscribeOperation.perform(ws, targetUserId)

    return new Response().addBackMessage({ response: { id: requestId, last_activity: targetUserActivity } })
  }

  async status_unsubscribe(ws, data) {
    const { id: requestId } = data

    const activityUserUnsubscribeOperation = ServiceLocatorContainer.use("ActivityUserUnsubscribeOperation")
    await activityUserUnsubscribeOperation.perform(ws)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }

  async get_user_status(ws, data) {
    const {
      id: requestId,
      user_last_activity: { ids: targetUserIds },
    } = data

    const activityUserRetrieveOperation = ServiceLocatorContainer.use("ActivityUserRetrieveOperation")
    const lastActivities = await activityUserRetrieveOperation.perform(ws, targetUserIds)

    return new Response().addBackMessage({ response: { id: requestId, last_activity: lastActivities } })
  }

  async online_list(ws, data) {
    const { id: requestId, online_list: onlineListParams } = data
    const { count: isCountRequest } = onlineListParams

    const onlineListOperation = ServiceLocatorContainer.use("OnlineListOperation")
    const result = await onlineListOperation.perform(ws, onlineListParams)

    const response = isCountRequest ? { count: result } : { users: result }

    return new Response().addBackMessage({ response: { id: requestId, ...response } })
  }

  async activity_status(ws, data) {
    const { id: requestId, activity_status: { isInactive } } = data

    const markActiveInactiveOperation = ServiceLocatorContainer.use("ActivityMarkActiveInactiveOperation")
    const result = await markActiveInactiveOperation.perform(ws, isInactive)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }
}

export default new ActivitiesController()
