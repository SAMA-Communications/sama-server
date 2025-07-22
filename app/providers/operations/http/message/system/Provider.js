import RegisterProvider from "../../../../../common/RegisterProvider.js"
import HttpMessageSendSystemOperation from "./index.js"

const name = "HttpMessageSendSystemOperation"

class HttpMessageSendSystemOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const messageSendSystemOperation = slc.use("MessageSendSystemOperation")

    return new HttpMessageSendSystemOperation(sessionService, messageSendSystemOperation)
  }
}

export default new HttpMessageSendSystemOperationRegisterProvider({
  name,
  implementationName: HttpMessageSendSystemOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
