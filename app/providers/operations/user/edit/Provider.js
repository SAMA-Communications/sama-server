import RegisterProvider from "../../../../common/RegisterProvider.js"
import UserEditOperation from "./index.js"

const name = "UserEditOperation"

class UserEditOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")
    const contactService = slc.use("ContactService")

    return new UserEditOperation(sessionService, userService, contactService)
  }
}

export default new UserEditOperationRegisterProvider({
  name,
  implementationName: UserEditOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
