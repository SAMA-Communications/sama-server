import { ERROR_STATUES } from "../../../../constants/errors.js"

class UserConnectSocketOperation {
  constructor(RuntimeDefinedContext, sessionService, userService, userTokenRepo) {
    this.RuntimeDefinedContext = RuntimeDefinedContext
    this.sessionService = sessionService
    this.userService = userService
    this.userTokenRepo = userTokenRepo
  }

  async perform(ws, connectionData) {
    const deviceId = connectionData.device_id.toString()

    const token = await this.userTokenRepo.findToken(connectionData.token, deviceId, "access")
    if (!token) {
      throw new Error(ERROR_STATUES.TOKEN_EXPIRED.message, {
        cause: ERROR_STATUES.TOKEN_EXPIRED,
      })
    }

    const user = await this.userService.userRepo.findById(token.user_id)

    // TODO: close connections
    this.sessionService.addUserDeviceConnection(ws, token.organization_id, user.native_id, deviceId)

    await this.sessionService.storeUserNodeData(
      this.RuntimeDefinedContext.APP_IP,
      this.RuntimeDefinedContext.CLUSTER_PORT,
      user.native_id,
      deviceId
    )

    return { user }
  }
}

export default UserConnectSocketOperation
