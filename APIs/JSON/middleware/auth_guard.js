import BaseMiddleware from "@sama/common/middleware.js"
import { ACTIVE } from "@sama/store/session.js"
import { ERROR_STATUES } from "../validations/constants/errors.js"

class AuthGuardMiddleware extends BaseMiddleware {
  handle (ws, json) {
    if (
      !ACTIVE.SESSIONS.get(ws) &&
      !json?.user_create &&
      !json?.user_login
    ) {
      throw new Error(ERROR_STATUES.UNAUTHORIZED.message, {
        cause: ERROR_STATUES.UNAUTHORIZED,
      });
    }
  }
}

export default new AuthGuardMiddleware()