import BaseHttpController from "./base.js"

import signature from "cookie-signature"

import extractRefreshTokenFromCookie from "../../../JSON/utils/extract_refresh_token_from_cookie.js"
import { ERROR_STATUES } from "../../../../app/constants/errors.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

class HttpAuthController extends BaseHttpController {
  #getRefreshTokenCookie(res, req) {
    const cookieHeader = this.getCookie(req)

    const signedToken = extractRefreshTokenFromCookie(cookieHeader)
    if (!signedToken) return null

    const unsignedToken = signature.unsign(signedToken.slice(2), process.env.COOKIE_SECRET)
    if (unsignedToken !== false) {
      return unsignedToken
    } else {
      this.setRefreshToken(res, signedToken, true) //uncommented changes
      throw new Error(ERROR_STATUES.INCORRECT_TOKEN.message, {
        cause: {
          status: ERROR_STATUES.INCORRECT_TOKEN.status,
          message: ERROR_STATUES.INCORRECT_TOKEN.message,
        },
      })
    }
  }

  #getAccessTokenFromHeader(req) {
    const token = req.getHeader("authorization")?.split(" ")?.[1]
    return token || null
  }

  async login(res, req) {
    try {
      const refresh_token = this.#getRefreshTokenCookie(res, req)
      const access_token = this.#getAccessTokenFromHeader(req)

      const { login, password, device_id } = await this.parseJsonBody(res)
      if (!device_id) {
        throw new Error(ERROR_STATUES.DEVICE_ID_MISSED.message, {
          cause: { status: ERROR_STATUES.DEVICE_ID_MISSED.status, message: ERROR_STATUES.DEVICE_ID_MISSED.message },
        })
      }

      const userAuthOperation = ServiceLocatorContainer.use("UserAuthOperation")
      const userInfo = { device_id }

      if (login && password) {
        Object.assign(userInfo, { login, password })
      } else if (access_token || refresh_token) {
        userInfo.token = access_token || refresh_token
      } else {
        throw new Error(ERROR_STATUES.MISSING_AUTH_CREDENTIALS.message, {
          cause: {
            status: ERROR_STATUES.MISSING_AUTH_CREDENTIALS.status,
            message: ERROR_STATUES.MISSING_AUTH_CREDENTIALS.message,
          },
        })
      }

      const { user, token: accessToken } = await userAuthOperation.perform(null, userInfo)

      const newRefreshToken = await userAuthOperation.createRefreshToken(user, device_id)

      const accessTokenExpiredAt =
        new Date(accessToken.updated_at).getTime() + process.env.JWT_ACCESS_TOKEN_EXPIRES_IN * 1000

      this.setStatus(res, 200)
        .setRefreshToken(res, newRefreshToken.token)
        .sendResponse(res, { user, access_token: accessToken.token, expired_at: accessTokenExpiredAt })
    } catch (err) {
      console.log(err)
      this.setStatus(res, err.cause?.status || 500).sendResponse(res, {
        message: err.cause?.message || ERROR_STATUES.INTERNAL_SERVER.message,
      })
    }
  }

  async logout(res, req) {
    try {
      const refresh_token = this.#getRefreshTokenCookie(res, req)
      const access_token = this.#getAccessTokenFromHeader(req)

      const sessionService = ServiceLocatorContainer.use("SessionService")
      const userTokenRepo = ServiceLocatorContainer.use("UserTokenRepository")

      const accessTokenRecord = await userTokenRepo.findToken(access_token, null, "access")
      if (!accessTokenRecord) {
        throw new Error(ERROR_STATUES.MISSING_AUTH_CREDENTIALS.message, {
          cause: {
            status: ERROR_STATUES.MISSING_AUTH_CREDENTIALS.status,
            message: ERROR_STATUES.MISSING_AUTH_CREDENTIALS.message,
          },
        })
      }

      const refreshTokenRecord = await userTokenRepo.findToken(refresh_token, accessTokenRecord.device_id, "refresh")

      if (!refreshTokenRecord) {
        throw new Error(ERROR_STATUES.INCORRECT_TOKEN.message, {
          cause: { status: ERROR_STATUES.INCORRECT_TOKEN.status, message: ERROR_STATUES.INCORRECT_TOKEN.message },
        })
      }

      const userId = refreshTokenRecord?.user_id

      const ws = sessionService.getUserDevices(userId).find((el) => el.deviceId === refreshTokenRecord.device_id)?.ws

      const userLogoutOperation = ServiceLocatorContainer.use("UserLogoutOperation")
      await userLogoutOperation.perform(ws)

      this.setStatus(res, 200).setRefreshToken(res, refreshTokenRecord.token, true).sendResponse(res, { success: true })
    } catch (err) {
      console.log(err)
      this.setStatus(res, err.cause?.status || 500).sendResponse(res, {
        message: err.cause?.message || ERROR_STATUES.INTERNAL_SERVER.message,
      })
    }
  }
}

export default new HttpAuthController()
