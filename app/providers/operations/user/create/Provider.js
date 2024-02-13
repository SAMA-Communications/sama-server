import RegisterProvider from '../../../../common/RegisterProvider.js'
import UserCreateOperation from './index.js'
import contactsMatchRepository from '../../../../repositories/contact_match_repository.js'

const name = 'UserCreateOperation'

class UserCreateOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const userService = slc.use('UserService')

    return new UserCreateOperation(
      userService,
      contactsMatchRepository
    )
  }
}

export default new UserCreateOperationRegisterProvider({ name, implementationName: UserCreateOperation.name })