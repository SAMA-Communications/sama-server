import RegisterProvider from "../../../../common/RegisterProvider.js"
import UserSearchOperation from "./index.js"

const name = "UserSearchOperation"

class UserSearchOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")

    return new UserSearchOperation(sessionService, userService)
  }
}

export default new UserSearchOperationRegisterProvider({ name, implementationName: UserSearchOperation.name })
