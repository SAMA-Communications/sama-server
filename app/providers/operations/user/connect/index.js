import { ERROR_STATUES } from "../../../../constants/errors.js"

class UserConnectSocketOperation {
  constructor(config, sessionService, userService, userTokenRepo) {
    this.config = config
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
    this.sessionService.addUserDeviceConnection(ws, user.organization_id, user.native_id, deviceId)

    await this.sessionService.storeUserNodeData(
      this.config.get("app.ip"),
      this.config.get("ws.cluster.port"),
      user.organization_id,
      user.native_id,
      deviceId
    )

    return { user }
  }
}

export default UserConnectSocketOperation
