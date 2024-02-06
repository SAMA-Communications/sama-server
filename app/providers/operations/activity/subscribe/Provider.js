import RegisterProvider from '../../../../common/RegisterProvider.js'
import ActivityUserSubscribeOperation from './index.js'
import sessionService from '../../../../repositories/session_repository.js'

const name = 'ActivityUserSubscribeOperation'

class ActivityUserSubscribeOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const activityManagerService = slc.use('ActivityManagerService')
    const userService = slc.use('UserService')

    return new ActivityUserSubscribeOperation(sessionService, activityManagerService, userService)
  }
}

export default new ActivityUserSubscribeOperationRegisterProvider({ name, implementationName: ActivityUserSubscribeOperation.name })