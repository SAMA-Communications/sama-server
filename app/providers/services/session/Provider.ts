import RegisterProvider from "../../../common/RegisterProvider.js"

import type { IServiceLocator } from "../../../common/service-locator-types.js"
import type { Config } from "../../../config/index.js"
import type { Logger } from "../../../logger/index.js"
import type { RedisManager } from "../../../lib/redis.js"
import type { ProviderName } from "../../../types/common.js"
import { ACTIVE } from "../../../store/session.js"

import SessionService from "./index.js"

const name: ProviderName = "SessionService"

class SessionServiceRegisterProvider extends RegisterProvider<SessionService> {
  register(slc: IServiceLocator): SessionService {
    const config = slc.use<Config>("Config")
    const logger = slc.use<Logger>("Logger").child("[SessionService]")
    const redisClient = slc.use<RedisManager>("RedisClient")

    return new SessionService(ACTIVE, config, logger, redisClient)
  }
}

export default new SessionServiceRegisterProvider({ name, implementationName: SessionService.name })
