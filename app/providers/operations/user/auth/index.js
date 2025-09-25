import jwt from "jsonwebtoken"

import { ERROR_STATUES } from "../../../../constants/errors.js"

class UserAuthOperation {
  constructor(config, sessionService, userService, userTokenRepo) {
    this.config = config
    this.sessionService = sessionService
    this.userService = userService
    this.userTokenRepo = userTokenRepo
  }

  async perform(ws, userInfo, omitDeviceConnection) {
    const organizationId = userInfo.organization_id
    const deviceId = userInfo.device_id.toString()

    const { user, token } = userInfo.token
      ? await this.#authByToken(userInfo.token, deviceId)
      : await this.#authByUserInfo(organizationId, userInfo, deviceId)

    // TODO: close connections
    if (!omitDeviceConnection) {
      this.sessionService.addUserDeviceConnection(ws, user.organization_id, user.native_id, deviceId)
    }

    const jwtAccessToken = this.#generateToken(
      user,
      "access",
      this.config.get("jwt.access.secret"),
      +this.config.get("jwt.access.expiresIn")
    )

    const updatedToken = await this.userTokenRepo.updateToken(token, organizationId, user.native_id, deviceId, jwtAccessToken, "access")

    await this.sessionService.storeUserNodeData(user.organization_id, user.native_id, deviceId)

    const userWithAvatarUrl = (await this.userService.addAvatarUrl([user])).at(0)

    return { user: userWithAvatarUrl, token: updatedToken }
  }

  #generateToken(user, type, secret, expiresIn) {
    return jwt.sign({ _id: user._id, native_id: user.native_id, login: user.login, type }, secret, { expiresIn })
  }

  async #authByToken(tokenJwt, deviceId) {
    const token = await this.userTokenRepo.findToken(tokenJwt, deviceId)

    if (!token) {
      throw new Error(ERROR_STATUES.TOKEN_EXPIRED.message, {
        cause: ERROR_STATUES.TOKEN_EXPIRED,
      })
    }

    const user = await this.userService.userRepo.findById(token.user_id)

    return { user, token }
  }

  async #authByUserInfo(organizationId, userInfo, deviceId) {
    const user = userInfo?.userId
      ? await this.userService.userRepo.findById(userInfo?.userId)
      : await this.userService.findByLogin(organizationId, userInfo.login)

    if (!user) {
      throw new Error(ERROR_STATUES.INCORRECT_LOGIN_OR_PASSWORD.message, {
        cause: ERROR_STATUES.INCORRECT_LOGIN_OR_PASSWORD,
      })
    }

    const isValid = await this.userService.validatePassword(user, userInfo.password)

    if (!isValid) {
      throw new Error(ERROR_STATUES.INCORRECT_LOGIN_OR_PASSWORD.message, {
        cause: ERROR_STATUES.INCORRECT_LOGIN_OR_PASSWORD,
      })
    }

    const token = await this.userTokenRepo.findTokenByUserId(user.native_id, deviceId, "access")

    return { user, token }
  }

  async createRefreshToken(user, deviceId) {
    const jwtToken = this.#generateToken(user, "refresh", this.config.get("jwt.refresh.secret"), +this.config.get("jwt.refresh.expiresIn"))

    const refreshToken = await this.userTokenRepo.updateToken(null, user.organization_id, user.native_id, deviceId, jwtToken, "refresh")

    return refreshToken
  }
}

export default UserAuthOperation
