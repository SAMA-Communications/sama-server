import RegisterProvider from '../../../../common/RegisterProvider.js'
import UserAuthOperation from './index.js'
import sessionService from '../../../../repositories/session_repository.js'

const name = 'UserAuthOperation'

class UserAuthOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const RuntimeDefinedContext = slc.use('RuntimeDefinedContext')
    const userService = slc.use('UserService')
    const userTokenRepo = slc.use('UserTokenRepository')

    return new UserAuthOperation(RuntimeDefinedContext, sessionService, userService, userTokenRepo)
  }
}

export default new UserAuthOperationRegisterProvider({ name, implementationName: UserAuthOperation.name })