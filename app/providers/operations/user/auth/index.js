import jwt from "jsonwebtoken"

import { ERROR_STATUES } from "../../../../constants/errors.js"

class UserAuthOperation {
  constructor(RuntimeDefinedContext, sessionService, userService, userTokenRepo) {
    this.RuntimeDefinedContext = RuntimeDefinedContext
    this.sessionService = sessionService
    this.userService = userService
    this.userTokenRepo = userTokenRepo
  }

  async perform(ws, userInfo) {
    const deviceId = userInfo.deviceId.toString()

    let user = null
    let token = null

    if (userInfo.token) {
      const { user: userModel, token: tokenModel } = await this.#authByToken(userInfo.token, deviceId)
      user = userModel
      token = tokenModel
    } else {
      const { user: userModel, token: tokenModel } = await this.#authByLogin(userInfo, deviceId)
      user = userModel
      token = tokenModel
    }

    // TODO: close connections
    const wsToClose = this.sessionService.addUserDeviceConnection(ws, user.native_id, deviceId)

    const jwtToken = jwt.sign(
      { _id: user._id, native_id: user.native_id, login: user.login },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
      }
    )

    token = await this.userTokenRepo.updateToken(token, user.native_id, deviceId, jwtToken)

    await this.sessionService.storeUserNodeData(
      this.RuntimeDefinedContext.APP_IP,
      this.RuntimeDefinedContext.CLUSTER_PORT,
      user.native_id,
      deviceId
    )

    const userWithAvatarUrl = (await this.userService.addAvatarUrl([user])).at(0)

    return { user: userWithAvatarUrl, token }
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

  async #authByLogin(userInfo, deviceId) {
    const user = await this.userService.findByLogin(userInfo)

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

    const token = await this.userTokenRepo.findTokenByUserId(user.native_id, deviceId)

    return { user, token }
  }
}

export default UserAuthOperation
