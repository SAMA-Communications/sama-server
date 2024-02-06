import RegisterProvider from '../../../../common/RegisterProvider.js'
import ActivityUserUnsubscribeOperation from './index.js'
import sessionService from '../../../../repositories/session_repository.js'

const name = 'ActivityUserUnsubscribeOperation'

class ActivityUserUnsubscribeOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const activityManagerService = slc.use('ActivityManagerService')

    return new ActivityUserUnsubscribeOperation(sessionService, activityManagerService)
  }
}

export default new ActivityUserUnsubscribeOperationRegisterProvider({ name, implementationName: ActivityUserUnsubscribeOperation.name })