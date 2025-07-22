import RegisterProvider from "../../../../common/RegisterProvider.js"
import UserAuthOperation from "./index.js"

const name = "UserAuthOperation"

class UserAuthOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const RuntimeDefinedContext = slc.use("RuntimeDefinedContext")
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")
    const userTokenRepo = slc.use("UserTokenRepository")

    return new UserAuthOperation(RuntimeDefinedContext, sessionService, userService, userTokenRepo)
  }
}

export default new UserAuthOperationRegisterProvider({
  name,
  implementationName: UserAuthOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
