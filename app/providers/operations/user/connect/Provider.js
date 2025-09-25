import RegisterProvider from "../../../../common/RegisterProvider.js"
import UserConnectSocketOperation from "./index.js"

const name = "UserConnectSocketOperation"

class UserConnectSocketOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const config = slc.use("Config")
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")
    const userTokenRepo = slc.use("UserTokenRepository")

    return new UserConnectSocketOperation(config, sessionService, userService, userTokenRepo)
  }
}

export default new UserConnectSocketOperationRegisterProvider({
  name,
  implementationName: UserConnectSocketOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
