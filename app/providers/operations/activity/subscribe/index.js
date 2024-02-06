import { CONSTANTS as MAIN_CONSTANTS } from '../../../../constants/constants.js'

class ActivityUserSubscribeOperation {
  constructor(sessionService, activityManagerService, userService) {
    this.sessionService = sessionService
    this.activityManagerService = activityManagerService
    this.userService = userService
  }

  async subscribeToUserActivity(ws, targetUserId) {
    const currentUserId = this.sessionService.getSessionUserId(ws)

    await this.activityManagerService.subscribeObserverToTarget(currentUserId, targetUserId)

    let targetUserActivityStatus = null
    const activeSessions = await this.sessionService.getUserNodeData(targetUserId)
  
    if (activeSessions.length) {
      targetUserActivityStatus = MAIN_CONSTANTS.LAST_ACTIVITY_STATUS.ONLINE
    } else {
      const targetUser = await this.userService.userRepo.findById(targetUserId)
      targetUserActivityStatus = targetUser.params.recent_activity
    }

    return { [targetUserId]: targetUserActivityStatus }
  }
}

export default ActivityUserSubscribeOperation
