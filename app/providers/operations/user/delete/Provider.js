import RegisterProvider from "../../../../common/RegisterProvider.js"
import UserDeleteOperation from "./index.js"

import contactsMatchRepository from "../../../../repositories/contact_match_repository.js"

const name = "UserDeleteOperation"

class UserDeleteOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")
    const activityManagerService = slc.use("ActivityManagerService")
    const blockListService = slc.use("BlockListService")

    return new UserDeleteOperation(
      sessionService,
      userService,
      activityManagerService,
      blockListService,
      contactsMatchRepository
    )
  }
}

export default new UserDeleteOperationRegisterProvider({ name, implementationName: UserDeleteOperation.name })
