import BaseMiddleware from "@sama/common/middleware.js"
import { ERROR_STATUES } from "@sama/constants/errors.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

class AuthGuardMiddleware extends BaseMiddleware {
  handle(ws, json) {
    const sessionService = ServiceLocatorContainer.use("SessionService")

    if (!sessionService.getSession(ws) && !json?.user_create && !json?.user_login && !json?.connect) {
      throw new Error(ERROR_STATUES.UNAUTHORIZED.message, {
        cause: ERROR_STATUES.UNAUTHORIZED,
      })
    }
  }
}

export default new AuthGuardMiddleware()
