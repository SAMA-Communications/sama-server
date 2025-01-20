import RegisterProvider from "../../../../common/RegisterProvider.js"
import UserConnectSocketOperation from "./index.js"

const name = "UserConnectSocketOperation"

class UserConnectSocketOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const RuntimeDefinedContext = slc.use("RuntimeDefinedContext")
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")
    const userTokenRepo = slc.use("UserTokenRepository")

    return new UserConnectSocketOperation(RuntimeDefinedContext, sessionService, userService, userTokenRepo)
  }
}

export default new UserConnectSocketOperationRegisterProvider({
  name,
  implementationName: UserConnectSocketOperation.name,
})
