import RegisterProvider from "../../../../../common/RegisterProvider.js"
import HttpUserLogoutOperation from "./index.js"

const name = "HttpUserLogoutOperation"

class HttpUserLogoutOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const messageCreateOperation = slc.use("MessageCreateOperation")

    return new HttpUserLogoutOperation(sessionService, messageCreateOperation)
  }
}

export default new HttpUserLogoutOperationRegisterProvider({
  name,
  implementationName: HttpUserLogoutOperation.name,
})
