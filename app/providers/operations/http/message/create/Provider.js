import RegisterProvider from "../../../../../common/RegisterProvider.js"
import HttpMessageCreateOperation from "./index.js"

const name = "HttpMessageCreateOperation"

class HttpMessageCreateOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const messageCreateOperation = slc.use("MessageCreateOperation")

    return new HttpMessageCreateOperation(sessionService, messageCreateOperation)
  }
}

export default new HttpMessageCreateOperationRegisterProvider({
  name,
  implementationName: HttpMessageCreateOperation.name,
})
