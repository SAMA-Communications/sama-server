import { CONSTANTS as MAIN_CONSTANTS } from '../../../../constants/constants.js'

class ActivityUserRetrieveOperation {
  constructor(sessionService, userService) {
    this.sessionService = sessionService
    this.userService = userService
  }

  async perform(ws, targetUserId) {
    const activities = {}
    const targetUsers = await this.userService.userRepo.findAllByIds(targetUserId)

    for (const targetUser of targetUsers) {
      const userId = targetUser.native_id
      const isUserOnline = await this.sessionService.getUserNodeData(userId)

      const targetUserActivityStatus = isUserOnline ? MAIN_CONSTANTS.LAST_ACTIVITY_STATUS.ONLINE : targetUser.recent_activity

      activities[userId] = targetUserActivityStatus
    }

    return activities
  }
}

export default ActivityUserRetrieveOperation
