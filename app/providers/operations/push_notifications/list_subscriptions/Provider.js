import RegisterProvider from "../../../../common/RegisterProvider.js"
import PushSubscriptionListOperation from "./index.js"

const name = "PushSubscriptionListOperation"

class PushSubscriptionListOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const pushNotificationService = slc.use("PushNotificationService")

    return new PushSubscriptionListOperation(sessionService, pushNotificationService)
  }
}

export default new PushSubscriptionListOperationRegisterProvider({
  name,
  implementationName: PushSubscriptionListOperation.name,
})
