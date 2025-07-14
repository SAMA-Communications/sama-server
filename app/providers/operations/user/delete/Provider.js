import RegisterProvider from "../../../../common/RegisterProvider.js"
import UserDeleteOperation from "./index.js"

const name = "UserDeleteOperation"

class UserDeleteOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")
    const activityManagerService = slc.use("ActivityManagerService")
    const blockListService = slc.use("BlockListService")
    const contactService = slc.use("ContactService")

    return new UserDeleteOperation(sessionService, userService, activityManagerService, blockListService, contactService)
  }
}

export default new UserDeleteOperationRegisterProvider({ name, implementationName: UserDeleteOperation.name })
