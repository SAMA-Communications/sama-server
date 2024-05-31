import { ERROR_STATUES } from "../../../../constants/errors.js"

class UserLogoutOperation {
  constructor(sessionService, userTokenRepo) {
    this.sessionService = sessionService
    this.userTokenRepo = userTokenRepo
  }

  async perform(ws) {
    const userId = this.sessionService.getSessionUserId(ws)

    if (!userId) {
      throw new Error(ERROR_STATUES.UNAUTHORIZED.message, {
        cause: ERROR_STATUES.UNAUTHORIZED,
      })
    }

    const deviceId = this.sessionService.getDeviceId(ws, userId)

    await this.sessionService.removeUserSession(ws, userId, deviceId)

    await this.userTokenRepo.deleteByUserId(userId, deviceId)

    return userId
  }
}

export default UserLogoutOperation
