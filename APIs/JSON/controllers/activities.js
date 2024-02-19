import BaseJSONController from './base.js'

import ServiceLocatorContainer from '@sama/common/ServiceLocatorContainer.js'

import Response from '@sama/networking/models/Response.js'

class LastActivitiesController extends BaseJSONController {
  async status_subscribe(ws, data) {
    const { id: requestId, user_last_activity_subscribe: { id: targetUserId } } = data

    const activityUserSubscribeOperation = ServiceLocatorContainer.use('ActivityUserSubscribeOperation')
    const targetUserActivity = await activityUserSubscribeOperation.perform(ws, targetUserId)

    return new Response().addBackMessage({ response: { id: requestId, last_activity: targetUserActivity } })
  }

  async status_unsubscribe(ws, data) {
    const { id: requestId } = data
    
    const activityUserUnsubscribeOperation = ServiceLocatorContainer.use('ActivityUserUnsubscribeOperation')
    await activityUserUnsubscribeOperation.perform(ws)

    return new Response().addBackMessage({ response: { id: requestId, success: true } })
  }

  async get_user_status(ws, data) {
    const { id: requestId, user_last_activity: { ids: targetUserIds } } = data

    const activityUserRetrieveOperation = ServiceLocatorContainer.use('ActivityUserRetrieveOperation')
    const lastActivities = await activityUserRetrieveOperation.perform(ws, targetUserIds)

    return new Response().addBackMessage({ response: { id: requestId, last_activity: lastActivities } })
  }
}

export default new LastActivitiesController()
