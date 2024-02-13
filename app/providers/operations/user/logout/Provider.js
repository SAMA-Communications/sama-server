import RegisterProvider from '../../../../common/RegisterProvider.js'
import UserLogoutOperation from './index.js'
import sessionService from '../../../../repositories/session_repository.js'

const name = 'UserLogoutOperation'

class UserLogoutOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const RuntimeDefinedContext = slc.use('RuntimeDefinedContext')
    const userTokenRepo = slc.use('UserTokenRepository')

    return new UserLogoutOperation(
      RuntimeDefinedContext,
      sessionService,
      userTokenRepo,
    )
  }
}

export default new UserLogoutOperationRegisterProvider({ name, implementationName: UserLogoutOperation.name })