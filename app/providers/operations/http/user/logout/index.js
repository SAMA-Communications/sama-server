import { ERROR_STATUES } from "../../../../../constants/errors.js"

class HttpUserLogoutOperation {
  constructor(helpers, sessionService, userTokenRepo, userLogoutOperation) {
    this.helpers = helpers
    this.sessionService = sessionService
    this.userTokenRepo = userTokenRepo
    this.userLogoutOperation = userLogoutOperation
  }

  async perform(fakeWsSessionKey, headers, cookies) {
    const refreshToken = cookies["refresh_token"]
    const accessToken = this.helpers.extractAccessTokenFromAuthHeader(headers["authorization"])

    const accessTokenRecord = await this.userTokenRepo.findToken(null, accessToken, null, "access")
    if (!accessTokenRecord) {
      throw new Error(ERROR_STATUES.MISSING_AUTH_CREDENTIALS.message, {
        cause: ERROR_STATUES.MISSING_AUTH_CREDENTIALS,
      })
    }

    const refreshTokenRecord = await this.userTokenRepo.findToken(
      accessTokenRecord.organization_id,
      refreshToken,
      accessTokenRecord.device_id,
      "refresh"
    )
    if (!refreshTokenRecord) {
      throw new Error(ERROR_STATUES.INCORRECT_TOKEN.message, {
        cause: ERROR_STATUES.INCORRECT_TOKEN,
      })
    }

    const { user_id: userId, device_id: deviceId } = refreshTokenRecord
    const ws = this.sessionService.getUserDevices(userId).find((el) => el.deviceId === deviceId)?.ws

    if (ws) {
      await this.userLogoutOperation.perform(ws)
    } else {
      await this.userTokenRepo.deleteByUserId(userId, deviceId)
    }

    return refreshTokenRecord
  }
}

export default HttpUserLogoutOperation
