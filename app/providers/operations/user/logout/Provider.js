import RegisterProvider from '../../../../common/RegisterProvider.js'
import UserLogoutOperation from './index.js'

const name = 'UserLogoutOperation'

class UserLogoutOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const RuntimeDefinedContext = slc.use('RuntimeDefinedContext')
    const sessionService = slc.use('SessionService')
    const userTokenRepo = slc.use('UserTokenRepository')

    return new UserLogoutOperation(
      RuntimeDefinedContext,
      sessionService,
      userTokenRepo,
    )
  }
}

export default new UserLogoutOperationRegisterProvider({ name, implementationName: UserLogoutOperation.name })