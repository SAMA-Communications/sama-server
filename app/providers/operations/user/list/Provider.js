import RegisterProvider from "../../../../common/RegisterProvider.js"
import UserListOperation from "./index.js"

const name = "UserListOperation"

class UserListOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const userService = slc.use("UserService")

    return new UserListOperation(userService)
  }
}

export default new UserListOperationRegisterProvider({ name, implementationName: UserListOperation.name })
