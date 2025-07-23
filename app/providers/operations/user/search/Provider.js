import RegisterProvider from "../../../../common/RegisterProvider.js"
import UserSearchOperation from "./index.js"

const name = "UserSearchOperation"

class UserSearchOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const config = slc.use("Config")
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")

    return new UserSearchOperation(config, sessionService, userService)
  }
}

export default new UserSearchOperationRegisterProvider({
  name,
  implementationName: UserSearchOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
