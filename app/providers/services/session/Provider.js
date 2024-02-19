import RegisterProvider from '../../../common/RegisterProvider.js'
import SessionService from './index.js'

import { ACTIVE } from '../../../store/session.js'

const name = 'SessionService'

class SessionServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const redisClient = slc.use('RedisClient')

    return new SessionService(ACTIVE, redisClient)
  }
}

export default new SessionServiceRegisterProvider({ name, implementationName: SessionService.name })