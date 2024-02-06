import RegisterProvider from '../../../../common/RegisterProvider.js'
import ActivityUserRetrieveOperation from './index.js'
import sessionService from '../../../../repositories/session_repository.js'

const name = 'ActivityUserRetrieveOperation'

class ActivityUserRetrieveOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const userService = slc.use('UserService')

    return new ActivityUserRetrieveOperation(sessionService, userService)
  }
}

export default new ActivityUserRetrieveOperationRegisterProvider({ name, implementationName: ActivityUserRetrieveOperation.name })