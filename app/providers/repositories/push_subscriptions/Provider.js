import RegisterProvider from "../../../common/RegisterProvider.js"
import PushSubscriptions from "../../../models/push_subscription.js"
import PushSubscriptionsRepository from "./index.js"

const name = "PushSubscriptionsRepository"

class PushSubscriptionsRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use("MongoConnection")
    const baseMapper = slc.use("BaseMapper")

    return new PushSubscriptionsRepository(mongoConnection, PushSubscriptions, baseMapper)
  }
}

export default new PushSubscriptionsRepositoryRegisterProvider({
  name,
  implementationName: PushSubscriptionsRepository.name,
})
