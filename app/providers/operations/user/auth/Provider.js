import RegisterProvider from "../../../../common/RegisterProvider.js"
import UserAuthOperation from "./index.js"

const name = "UserAuthOperation"

class UserAuthOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const config = slc.use("Config")
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")
    const userTokenRepo = slc.use("UserTokenRepository")

    return new UserAuthOperation(config, sessionService, userService, userTokenRepo)
  }
}

export default new UserAuthOperationRegisterProvider({
  name,
  implementationName: UserAuthOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
