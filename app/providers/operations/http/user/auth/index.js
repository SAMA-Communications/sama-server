import { ERROR_STATUES } from "../../../../../constants/errors.js"

class HttpUserAuthOperation {
  constructor(config, helpers, userAuthOperation) {
    this.config = config
    this.helpers = helpers
    this.userAuthOperation = userAuthOperation
  }

  async perform(fakeWsSessionKey, headers, cookies, payload) {
    const refreshToken = cookies["refresh_token"]
    const accessToken = this.helpers.extractAccessTokenFromAuthHeader(headers["authorization"])

    const { organization_id, login, password, device_id } = payload
    if (!device_id) {
      throw new Error(ERROR_STATUES.DEVICE_ID_MISSED.message, {
        cause: ERROR_STATUES.DEVICE_ID_MISSED,
      })
    }

    const userInfo = { device_id }

    if (login && password) {
      Object.assign(userInfo, { login, password, organization_id })
    } else if (accessToken || refreshToken) {
      userInfo.token = accessToken || refreshToken
    } else {
      throw new Error(ERROR_STATUES.MISSING_AUTH_CREDENTIALS.message, {
        cause: ERROR_STATUES.MISSING_AUTH_CREDENTIALS,
      })
    }

    const { user, token: newAccessToken } = await this.userAuthOperation.perform(fakeWsSessionKey, userInfo, true)
    const newRefreshToken = await this.userAuthOperation.createRefreshToken(user, device_id)

    const accessTokenExpiredAt = new Date(newAccessToken.updated_at).getTime() + this.config.get("jwt.access.expiresIn") * 1000

    return { user, newAccessToken, accessTokenExpiredAt, newRefreshToken }
  }
}

export default HttpUserAuthOperation
