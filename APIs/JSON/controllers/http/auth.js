import BaseHttpController from "./base.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

import HttpResponse from "@sama/networking/models/HttpResponse.js"
import Response from "@sama/networking/models/Response.js"

class HttpAuthController extends BaseHttpController {
  async login(res, req) {
    const payload = res.parsedBody

    const httpAuthOperation = ServiceLocatorContainer.use("HttpUserAuthOperation")

    const { user, newAccessToken, accessTokenExpiredAt, newRefreshToken } = await httpAuthOperation.perform(
      res.fakeWsSessionKey,
      res.parsedHeaders,
      res.parsedSignedCookies,
      payload
    )

    const httpResponse = new HttpResponse(
      200,
      {},
      {
        user: user.visibleParams(),
        access_token: newAccessToken.token,
        expired_at: accessTokenExpiredAt,
      }
    ).addCookie("refresh_token", newRefreshToken.token, {
      maxAge: +process.env.JWT_REFRESH_TOKEN_EXPIRES_IN,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    })

    return new Response().setHttpResponse(httpResponse)
  }

  async logout(res, req) {
    // try {
    //   const refresh_token = this.#getRefreshTokenCookie(res, req)
    //   const access_token = this.#getAccessTokenFromHeader(req)
    //   const sessionService = ServiceLocatorContainer.use("SessionService")
    //   const userTokenRepo = ServiceLocatorContainer.use("UserTokenRepository")
    //   const accessTokenRecord = await userTokenRepo.findToken(access_token, null, "access")
    //   if (!accessTokenRecord) {
    //     throw new Error(ERROR_STATUES.MISSING_AUTH_CREDENTIALS.message, {
    //       cause: {
    //         status: ERROR_STATUES.MISSING_AUTH_CREDENTIALS.status,
    //         message: ERROR_STATUES.MISSING_AUTH_CREDENTIALS.message,
    //       },
    //     })
    //   }
    //   const refreshTokenRecord = await userTokenRepo.findToken(refresh_token, accessTokenRecord.device_id, "refresh")
    //   if (!refreshTokenRecord) {
    //     throw new Error(ERROR_STATUES.INCORRECT_TOKEN.message, {
    //       cause: { status: ERROR_STATUES.INCORRECT_TOKEN.status, message: ERROR_STATUES.INCORRECT_TOKEN.message },
    //     })
    //   }
    //   const userId = refreshTokenRecord?.user_id
    //   const ws = sessionService.getUserDevices(userId).find((el) => el.deviceId === refreshTokenRecord.device_id)?.ws
    //   const userLogoutOperation = ServiceLocatorContainer.use("UserLogoutOperation")
    //   await userLogoutOperation.perform(ws)
    //   this.setStatus(res, 200).setRefreshToken(res, refreshTokenRecord.token, true).sendResponse(res, { success: true })
    // } catch (err) {
    //   console.log(err)
    //   this.setStatus(res, err.cause?.status || 500).sendResponse(res, {
    //     message: err.cause?.message || ERROR_STATUES.INTERNAL_SERVER.message,
    //   })
    // }
  }
}

export default new HttpAuthController()
