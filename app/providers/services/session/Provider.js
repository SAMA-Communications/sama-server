import RegisterProvider from "../../../common/RegisterProvider.js"
import SessionService from "./index.js"

import { ACTIVE } from "../../../store/session.js"

const name = "SessionService"

class SessionServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const config = slc.use("Config")
    const logger = slc.use("Logger").child("[SessionService]")
    const redisClient = slc.use("RedisClient")

    return new SessionService(ACTIVE, config, logger, redisClient)
  }
}

export default new SessionServiceRegisterProvider({ name, implementationName: SessionService.name })
