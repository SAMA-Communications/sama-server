import jwt from 'jsonwebtoken'

import { ERROR_STATUES } from '../../../../constants/errors.js'

class UserAuthOperation {
  constructor(RuntimeDefinedContext, sessionService, userService, userTokenRepo) {
    this.RuntimeDefinedContext = RuntimeDefinedContext
    this.sessionService = sessionService
    this.userService = userService
    this.userTokenRepo = userTokenRepo
  }

  async authorize(ws, userInfo) {
    const deviceId = userInfo.deviceId.toString()

    let user = null
    let token = null

    if (userInfo.token) {
      const { user: userModel, token: tokenModel } = await this.authByToken(userInfo.token, deviceId)
      user = userModel
      token = tokenModel
    } else {
      const { user: userModel, token: tokenModel } = await this.authByLogin(userInfo, deviceId)
      user = userModel
      token = tokenModel
    }

    const wsToClose = this.sessionService.addUserDeviceConnection(ws, user.params._id, deviceId)
    wsToClose.forEach((ws) => {
      try {
        ws.send(JSON.stringify({ error: 'Device replacement' }))
        ws.close()
      } catch (e) {
        console.log('[ClientManager] missing connection with ws client')
      }
    })

    const jwtToken = jwt.sign(
      { _id: user.params._id, login: user.params.login },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN,
      }
    )

    token = await this.userTokenRepo.updateToken(token, user.params._id, deviceId, jwtToken)

    await this.sessionService.storeUserNodeData(
      user.params._id,
      deviceId,
      this.RuntimeDefinedContext.APP_IP,
      this.RuntimeDefinedContext.CLUSTER_PORT
    )

    return { user, token }
  }

  async authByToken(tokenJwt, deviceId) {
    const token = await this.userTokenRepo.findToken(tokenJwt, deviceId) 

    if (!token) {
      throw new Error(ERROR_STATUES.TOKEN_EXPIRED.message, {
        cause: ERROR_STATUES.TOKEN_EXPIRED,
      })
    }

    const user = await this.userService.userRepo.findById(token.params.user_id)

    return { user, token }
  }

  async authByLogin(userInfo, deviceId) {
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

    const token = await this.userTokenRepo.findTokenByUserId(user._id, deviceId)

    return { user, token }
  }
}

export default UserAuthOperation