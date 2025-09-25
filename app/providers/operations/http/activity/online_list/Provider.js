import RegisterProvider from "../../../../../common/RegisterProvider.js"
import HttpActivityOnlineListOperation from "./index.js"

const name = "HttpActivityOnlineListOperation"

class HttpActivityOnlineListOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const onlineListOperation = slc.use("OnlineListOperation")

    return new HttpActivityOnlineListOperation(sessionService, onlineListOperation)
  }
}

export default new HttpActivityOnlineListOperationRegisterProvider({
  name,
  implementationName: HttpActivityOnlineListOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
