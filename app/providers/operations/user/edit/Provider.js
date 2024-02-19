import RegisterProvider from '../../../../common/RegisterProvider.js'
import UserEditOperation from './index.js'

import contactsMatchRepository from '../../../../repositories/contact_match_repository.js'

const name = 'UserEditOperation'

class UserEditOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use('SessionService')
    const userService = slc.use('UserService')

    return new UserEditOperation(
      sessionService,
      userService,
      contactsMatchRepository
    )
  }
}

export default new UserEditOperationRegisterProvider({ name, implementationName: UserEditOperation.name })