import RegisterProvider from "../../../../../common/RegisterProvider.js"
import HttpMessageReactionOperation from "./index.js"

const name = "HttpMessageReactionOperation"

class HttpMessageReactionOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const messageReactionsUpdateOperation = slc.use("MessageReactionsUpdateOperation")

    return new HttpMessageReactionOperation(sessionService, messageReactionsUpdateOperation)
  }
}

export default new HttpMessageReactionOperationRegisterProvider({
  name,
  implementationName: HttpMessageReactionOperation.name,
})
