import RegisterProvider from "../../../../common/RegisterProvider.js"
import OnlineListOperation from "./index.js"

const name = "OnlineListOperation"

class OnlineListOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")

    return new OnlineListOperation(sessionService, userService)
  }
}

export default new OnlineListOperationRegisterProvider({
  name,
  implementationName: OnlineListOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
