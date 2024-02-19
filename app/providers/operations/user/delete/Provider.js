import RegisterProvider from '../../../../common/RegisterProvider.js'
import UserDeleteOperation from './index.js'

import blockListRepository from '../../../../repositories/blocklist_repository.js'
import contactsMatchRepository from '../../../../repositories/contact_match_repository.js'

const name = 'UserDeleteOperation'

class UserDeleteOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use('SessionService')
    const userService = slc.use('UserService')
    const activityManagerService = slc.use('ActivityManagerService')

    return new UserDeleteOperation(
      sessionService,
      userService,
      activityManagerService,
      blockListRepository,
      contactsMatchRepository
    )
  }
}

export default new UserDeleteOperationRegisterProvider({ name, implementationName: UserDeleteOperation.name })