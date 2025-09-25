import RegisterProvider from "../../../../../common/RegisterProvider.js"
import HttpMessageReadOperation from "./index.js"

const name = "HttpMessageReadOperation"

class HttpMessageReadOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const messageReadOperation = slc.use("MessageReadOperation")

    return new HttpMessageReadOperation(sessionService, messageReadOperation)
  }
}

export default new HttpMessageReadOperationRegisterProvider({
  name,
  implementationName: HttpMessageReadOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
