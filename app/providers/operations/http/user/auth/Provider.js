import RegisterProvider from "../../../../../common/RegisterProvider.js"
import HttpUserAuthOperation from "./index.js"

const name = "HttpUserAuthOperation"

class HttpUserAuthOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const config = slc.use("Config")
    const helpers = slc.use("Helpers")
    const userAuthOperation = slc.use("UserAuthOperation")

    return new HttpUserAuthOperation(config, helpers, userAuthOperation)
  }
}

export default new HttpUserAuthOperationRegisterProvider({
  name,
  implementationName: HttpUserAuthOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
