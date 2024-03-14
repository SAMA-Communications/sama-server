import RegisterProvider from '../../../common/RegisterProvider.js'
import SessionService from './index.js'

import { ACTIVE } from '../../../store/session.js'

const name = 'SessionService'

class SessionServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const redisClient = slc.use('RedisClient')
    const RuntimeDefinedContext = slc.use('RuntimeDefinedContext')

    return new SessionService(ACTIVE, redisClient, RuntimeDefinedContext)
  }
}

export default new SessionServiceRegisterProvider({ name, implementationName: SessionService.name })