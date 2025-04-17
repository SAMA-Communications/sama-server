import RegisterProvider from "../../../common/RegisterProvider.js"
import PushNotificationService from "./index.js"

const name = "PushNotificationService"

class PushNotificationServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const pushEventRepo = slc.use("PushEventRepository")
    const pushSubscriptionsRepo = slc.use("PushSubscriptionsRepository")

    const pushQueueService = slc.use("PushQueueService")

    return new PushNotificationService(pushEventRepo, pushSubscriptionsRepo, pushQueueService)
  }
}

export default new PushNotificationServiceRegisterProvider({ name, implementationName: PushNotificationService.name })
