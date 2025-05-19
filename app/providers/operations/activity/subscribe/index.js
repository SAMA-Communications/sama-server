import { ERROR_STATUES } from "../../../../constants/errors.js"

class ActivityUserSubscribeOperation {
  constructor(helpers, sessionService, activityManagerService, userService) {
    this.helpers = helpers
    this.sessionService = sessionService
    this.activityManagerService = activityManagerService
    this.userService = userService
  }

  async perform(ws, targetUserId) {
    const { userId: currentUserId, organizationId } = this.sessionService.getSession(ws)

    const targetUser = await this.userService.userRepo.findById(targetUserId)

    if (!targetUser || !this.helpers.isEqualsNativeIds(targetUser.organization_id, organizationId)) {
      throw new Error(ERROR_STATUES.INCORRECT_USER.message, {
        cause: ERROR_STATUES.INCORRECT_USER,
      })
    }

    await this.activityManagerService.subscribeObserverToTarget(currentUserId, targetUserId)

    let targetUserActivityStatus = null
    const activeSessions = await this.sessionService.listUserDevice(organizationId, targetUserId)

    if (activeSessions?.length) {
      targetUserActivityStatus = 0
    } else {
      targetUserActivityStatus = targetUser.recent_activity
    }

    return { [targetUserId]: targetUserActivityStatus }
  }
}

export default ActivityUserSubscribeOperation
