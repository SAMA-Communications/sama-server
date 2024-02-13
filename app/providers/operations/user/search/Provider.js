import RegisterProvider from '../../../../common/RegisterProvider.js'
import UserSearchOperation from './index.js'
import sessionService from '../../../../repositories/session_repository.js'

const name = 'UserSearchOperation'

class UserSearchOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const userService = slc.use('UserService')

    return new UserSearchOperation(
      sessionService,
      userService
    )
  }
}

export default new UserSearchOperationRegisterProvider({ name, implementationName: UserSearchOperation.name })