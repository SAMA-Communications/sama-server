import jwt from "jsonwebtoken"

import { ERROR_STATUES } from "../../../../constants/errors.js"
import type { Config } from "../../../../config/index.js"
import type { UserModelProps } from "../../../../models/user.js"
import type { OrganizationNativeId, SessionDeviceId, UserNativeId } from "../../../../types/common.js"
import type { SamaSocket } from "../../../../types/socket-types.js"
import type SessionService from "../../../services/session/index.js"
import type UserService from "../../../services/user/index.js"

type UserAuthInfo = {
  organization_id: OrganizationNativeId,
  userId?: UserNativeId
  device_id: string
  token?: string
  login?: string
  password?: string
}

type UserAuthResult = {
  user: UserModelProps
  token: any
}

export default class UserAuthOperation {
  config: Config
  sessionService: SessionService
  userService: UserService
  userTokenRepo: any

  constructor(config: Config, sessionService: SessionService, userService: UserService, userTokenRepo: any) {
    this.config = config
    this.sessionService = sessionService
    this.userService = userService
    this.userTokenRepo = userTokenRepo
  }

  async perform(
    ws: SamaSocket,
    userInfo: UserAuthInfo,
    omitDeviceConnection?: boolean,
  ): Promise<UserAuthResult> {
    const organizationId = userInfo.organization_id
    const deviceId = userInfo.device_id.toString()

    const { user, token } = userInfo.token
      ? await this.#authByToken(userInfo.token, deviceId)
      : await this.#authByUserInfo(organizationId, userInfo, deviceId)

    if (!omitDeviceConnection) {
      await this.sessionService.addUserDeviceConnection(ws, user.organization_id, user.native_id, deviceId)
    }

    const jwtAccessToken = this.#generateToken(
      user,
      "access",
      this.config.get("jwt.access.secret"),
      +this.config.get("jwt.access.expiresIn"),
    )

    const updatedToken = await this.userTokenRepo.updateToken(
      token,
      organizationId,
      user.native_id,
      deviceId,
      jwtAccessToken,
      "access",
    )

    await this.sessionService.storeUserNodeData(ws, user.organization_id, user.native_id, deviceId)

    const userWithAvatarUrl = (await this.userService.addAvatarUrl([user])).at(0)

    return { user: userWithAvatarUrl, token: updatedToken }
  }

  #generateToken(user: UserModelProps, type: string, secret: string, expiresIn: number): string {
    return jwt.sign({ _id: user._id, native_id: user.native_id, login: user.login, type }, secret, { expiresIn })
  }

  async #authByToken(tokenJwt: string, deviceId: SessionDeviceId): Promise<UserAuthResult> {
    const token = await this.userTokenRepo.findToken(tokenJwt, deviceId)

    if (!token) {
      throw new Error(ERROR_STATUES.TOKEN_EXPIRED.message, {
        cause: ERROR_STATUES.TOKEN_EXPIRED,
      })
    }

    const user = await this.userService.userRepo.findById<UserModelProps>(token.user_id)

    return { user, token }
  }

  async #authByUserInfo(
    organizationId: OrganizationNativeId,
    userInfo: UserAuthInfo,
    deviceId: SessionDeviceId,
  ): Promise<UserAuthResult> {
    const user = userInfo?.userId
      ? await this.userService.userRepo.findById<UserModelProps>(userInfo.userId as string)
      : await this.userService.findByLogin(organizationId, userInfo.login!)

    if (!user) {
      throw new Error(ERROR_STATUES.INCORRECT_LOGIN_OR_PASSWORD.message, {
        cause: ERROR_STATUES.INCORRECT_LOGIN_OR_PASSWORD,
      })
    }

    const isValid = await this.userService.validatePassword(user, userInfo.password!)

    if (!isValid) {
      throw new Error(ERROR_STATUES.INCORRECT_LOGIN_OR_PASSWORD.message, {
        cause: ERROR_STATUES.INCORRECT_LOGIN_OR_PASSWORD,
      })
    }

    const token = await this.userTokenRepo.findTokenByUserId(user.native_id, deviceId, "access")

    return { user, token }
  }

  async createRefreshToken(user: UserModelProps, deviceId: SessionDeviceId): Promise<any> {
    const jwtToken = this.#generateToken(
      user,
      "refresh",
      this.config.get<string>("jwt.refresh.secret"),
      +this.config.get("jwt.refresh.expiresIn"),
    )

    return await this.userTokenRepo.updateToken(null, user.organization_id, user.native_id, deviceId, jwtToken, "refresh")
  }
}
