import RegisterProvider from "../../../common/RegisterProvider.js"
import PushQueueService from "./index.js"

const name = "PushQueueService"

class PushQueueServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const pushQueueName = process.env.SAMA_NATIVE_PUSH_QUEUE_NAME
    const redisUrl = process.env.REDIS_URL

    const pushEventRepo = slc.use("PushEventRepository")
    const pushSubscriptionsRepo = slc.use("PushSubscriptionsRepository")

    return new PushQueueService(pushQueueName, redisUrl, pushEventRepo, pushSubscriptionsRepo)
  }
}

export default new PushQueueServiceRegisterProvider({
  name,
  implementationName: PushQueueService.name,
  scope: RegisterProvider.SCOPE.SINGLETON,
})
