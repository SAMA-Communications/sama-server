import { CONSTANTS as MAIN_CONSTANTS } from "../../../../constants/constants.js"

class ActivityUserRetrieveOperation {
  constructor(sessionService, userService) {
    this.sessionService = sessionService
    this.userService = userService
  }

  async perform(ws, targetUserId) {
    const activities = {}

    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const targetUsers = await this.userService.userRepo.findWithOrScopeByIds(organizationId, targetUserId)

    for (const targetUser of targetUsers) {
      const userId = targetUser.native_id
      const isUserOnline = !!(await this.sessionService.listUserDevice(organizationId, userId))

      const targetUserActivityStatus = isUserOnline
        ? 0
        : targetUser.recent_activity

      activities[userId] = targetUserActivityStatus
    }

    return activities
  }
}

export default ActivityUserRetrieveOperation
