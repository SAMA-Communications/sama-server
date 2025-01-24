import RegisterProvider from "../../../common/RegisterProvider.js"
import OperationsLogRepository from "../../../models/operations_log.js"
import OperationsLogRepository from "./index.js"

const name = "OperationsLogRepository"

class OperationsLogRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use("MongoConnection")
    const baseMapper = slc.use("BaseMapper")

    return new OperationsLogRepository(mongoConnection, OperationsLogRepository, baseMapper)
  }
}

export default new OperationsLogRepositoryRegisterProvider({ name, implementationName: OperationsLogRepository.name })
