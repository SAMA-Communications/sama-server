import RegisterProvider from '../../../../common/RegisterProvider.js'
import UserEditOperation from './index.js'
import sessionService from '../../../../repositories/session_repository.js'
import contactsMatchRepository from '../../../../repositories/contact_match_repository.js'

const name = 'UserEditOperation'

class UserEditOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const userService = slc.use('UserService')

    return new UserEditOperation(
      sessionService,
      userService,
      contactsMatchRepository
    )
  }
}

export default new UserEditOperationRegisterProvider({ name, implementationName: UserEditOperation.name })