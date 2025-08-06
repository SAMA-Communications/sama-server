import RegisterProvider from "../../../../common/RegisterProvider.js"
import UserListOperation from "./index.js"

const name = "UserListOperation"

class UserListOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")

    return new UserListOperation(sessionService, userService)
  }
}

export default new UserListOperationRegisterProvider({
  name,
  implementationName: UserListOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
