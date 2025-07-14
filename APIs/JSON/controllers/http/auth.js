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
    const httpLogoutOperation = ServiceLocatorContainer.use("HttpUserLogoutOperation")

    const refreshTokenRecord = await httpLogoutOperation.perform(res.fakeWsSessionKey, res.parsedHeaders, res.parsedSignedCookies)

    const httpResponse = new HttpResponse(200, {}, { success: true }).addCookie("refresh_token", refreshTokenRecord.token, {
      maxAge: 0,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    })

    return new Response().setHttpResponse(httpResponse)
  }
}

export default new HttpAuthController()
