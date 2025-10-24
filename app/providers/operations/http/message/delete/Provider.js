import RegisterProvider from "../../../../../common/RegisterProvider.js"
import HttpMessageDeleteOperation from "./index.js"

const name = "HttpMessageDeleteOperation"

class HttpMessageDeleteOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const messageDeleteOperation = slc.use("MessageDeleteOperation")

    return new HttpMessageDeleteOperation(sessionService, messageDeleteOperation)
  }
}

export default new HttpMessageDeleteOperationRegisterProvider({
  name,
  implementationName: HttpMessageDeleteOperation.name,
})
