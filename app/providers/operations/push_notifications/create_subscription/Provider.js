import RegisterProvider from "../../../../common/RegisterProvider.js"
import PushSubscriptionCreateOperation from "./index.js"

const name = "PushSubscriptionCreateOperation"

class PushSubscriptionCreateOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const pushNotificationService = slc.use("PushNotificationService")

    return new PushSubscriptionCreateOperation(sessionService, pushNotificationService)
  }
}

export default new PushSubscriptionCreateOperationRegisterProvider({
  name,
  implementationName: PushSubscriptionCreateOperation.name,
})
