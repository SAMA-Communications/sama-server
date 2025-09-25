import RegisterProvider from "../../../../common/RegisterProvider.js"
import PushSubscriptionDeleteOperation from "./index.js"

const name = "PushSubscriptionDeleteOperation"

class PushSubscriptionDeleteOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const pushNotificationService = slc.use("PushNotificationService")

    return new PushSubscriptionDeleteOperation(sessionService, pushNotificationService)
  }
}

export default new PushSubscriptionDeleteOperationRegisterProvider({
  name,
  implementationName: PushSubscriptionDeleteOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
