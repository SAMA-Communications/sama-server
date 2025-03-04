import RegisterProvider from "../../../common/RegisterProvider.js"
import PushEvent from "../../../models/push_event.js"
import PushEventRepository from "./index.js"

const name = "PushEventRepository"

class PushEventRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use("MongoConnection")
    const baseMapper = slc.use("BaseMapper")

    return new PushEventRepository(mongoConnection, PushEvent, baseMapper)
  }
}

export default new PushEventRepositoryRegisterProvider({ name, implementationName: PushEventRepository.name })
