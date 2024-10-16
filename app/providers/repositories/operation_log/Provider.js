import RegisterProvider from "../../../common/RegisterProvider.js"
import OpLog from "../../../models/operations_log.js"
import OperationLogRepository from "./index.js"

const name = "OperationLogRepository"

class OperationLogRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use("MongoConnection")
    const baseMapper = slc.use("BaseMapper")

    return new OperationLogRepository(mongoConnection, OpLog, baseMapper)
  }
}

export default new OperationLogRepositoryRegisterProvider({ name, implementationName: OperationLogRepository.name })
