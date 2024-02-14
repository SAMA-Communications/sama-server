import RegisterProvider from '../../../../common/RegisterProvider.js'
import ActivityUserSubscribeOperation from './index.js'

const name = 'ActivityUserSubscribeOperation'

class ActivityUserSubscribeOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use('SessionService')
    const activityManagerService = slc.use('ActivityManagerService')
    const userService = slc.use('UserService')
    const userMapper = slc.use('UserMapper')

    return new ActivityUserSubscribeOperation(sessionService, activityManagerService, userService, userMapper)
  }
}

export default new ActivityUserSubscribeOperationRegisterProvider({ name, implementationName: ActivityUserSubscribeOperation.name })