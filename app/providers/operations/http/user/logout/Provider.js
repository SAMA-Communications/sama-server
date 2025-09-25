import RegisterProvider from "../../../../../common/RegisterProvider.js"
import HttpUserLogoutOperation from "./index.js"

const name = "HttpUserLogoutOperation"

class HttpUserLogoutOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const helpers = slc.use("Helpers")
    const sessionService = slc.use("SessionService")
    const userTokenRepo = slc.use("UserTokenRepository")
    const userLogoutOperation = slc.use("UserLogoutOperation")

    return new HttpUserLogoutOperation(helpers, sessionService, userTokenRepo, userLogoutOperation)
  }
}

export default new HttpUserLogoutOperationRegisterProvider({
  name,
  implementationName: HttpUserLogoutOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
