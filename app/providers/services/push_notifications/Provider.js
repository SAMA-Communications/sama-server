import RegisterProvider from "../../../common/RegisterProvider.js"
import PushNotificationService from "./index.js"

const name = "PushNotificationService"

class PushNotificationServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const RuntimeDefinedContext = slc.use("RuntimeDefinedContext")
    const pushEventRepo = slc.use("PushEventRepository")
    const pushSubscriptionsRepo = slc.use("PushSubscriptionsRepository")

    return new PushNotificationService(RuntimeDefinedContext, pushEventRepo, pushSubscriptionsRepo)
  }
}

export default new PushNotificationServiceRegisterProvider({ name, implementationName: PushNotificationService.name })
