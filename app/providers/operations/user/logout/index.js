import { ERROR_STATUES } from "../../../../constants/errors.js"

class UserLogoutOperation {
  constructor(sessionService, userTokenRepo, encryptionRepo) {
    this.sessionService = sessionService
    this.userTokenRepo = userTokenRepo
    this.encryptionRepo = encryptionRepo
  }

  async perform(ws) {
    const { userId, organizationId } = this.sessionService.getSession(ws)

    if (!userId) {
      throw new Error(ERROR_STATUES.UNAUTHORIZED.message, {
        cause: ERROR_STATUES.UNAUTHORIZED,
      })
    }

    const deviceId = this.sessionService.getDeviceId(ws, userId)

    await this.encryptionRepo.removeByDeviceId(userId, deviceId)

    await this.sessionService.removeUserSession(ws, userId, deviceId)

    await this.userTokenRepo.deleteByUserId(userId, deviceId)

    return { organizationId, userId }
  }
}

export default UserLogoutOperation
