import RegisterProvider from "../../../../../common/RegisterProvider.js"
import HttpMessageEditOperation from "./index.js"

const name = "HttpMessageEditOperation"

class HttpMessageEditOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const messageEditOperation = slc.use("MessageEditOperation")

    return new HttpMessageEditOperation(sessionService, messageEditOperation)
  }
}

export default new HttpMessageEditOperationRegisterProvider({
  name,
  implementationName: HttpMessageEditOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
