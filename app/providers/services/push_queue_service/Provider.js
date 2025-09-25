import RegisterProvider from "../../../common/RegisterProvider.js"
import PushQueueService from "./index.js"

const name = "PushQueueService"

class PushQueueServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const config = slc.use("Config")
    const pushEventRepo = slc.use("PushEventRepository")
    const pushSubscriptionsRepo = slc.use("PushSubscriptionsRepository")

    return new PushQueueService(config, pushEventRepo, pushSubscriptionsRepo)
  }
}

export default new PushQueueServiceRegisterProvider({
  name,
  implementationName: PushQueueService.name,
})
