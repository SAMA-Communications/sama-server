import { ERROR_STATUES } from '../../../../constants/errors.js'
import { ACTIVE } from '../../../../store/session.js'

class UserLogoutOperation {
  constructor(
    RuntimeDefinedContext,
    sessionService,
    userTokenRepo
  ) {
    this.RuntimeDefinedContext = RuntimeDefinedContext
    this.sessionService = sessionService
    this.userTokenRepo = userTokenRepo
  }

  async perform (ws) {
    const currentUserSession = ACTIVE.SESSIONS.get(ws)
    const userId = currentUserSession.user_id

    const deviceId = this.sessionService.getDeviceId(ws, userId)

    if (!currentUserSession) {
      throw new Error(ERROR_STATUES.UNAUTHORIZED.message, {
        cause: ERROR_STATUES.UNAUTHORIZED,
      })
    }

    if (ACTIVE.DEVICES[userId].length > 1) {
      ACTIVE.DEVICES[userId] = ACTIVE.DEVICES[userId].filter((obj) => {
        return obj.deviceId !== deviceId
      })
    } else {
      delete ACTIVE.DEVICES[userId]
      ACTIVE.SESSIONS.delete(ws)
    }

    await this.userTokenRepo.deleteByUserId(userId, deviceId)

    await this.sessionService.removeUserNodeData(
      userId,
      deviceId,
      this.RuntimeDefinedContext.APP_IP,
      this.RuntimeDefinedContext.CLUSTER_PORT
    )

    return userId
  }
}

export default UserLogoutOperation
