import RegisterProvider from "../../../../common/RegisterProvider.js"
import OperationLogLogsOperation from "./index.js"

const name = "OperationLogLogsOperation"

class OperationLogLogsOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const operationLogRepo = slc.use("OperationLogRepository")
    const sessionService = slc.use("SessionService")

    return new OperationLogLogsOperation(operationLogRepo, sessionService)
  }
}

export default new OperationLogLogsOperationRegisterProvider({
  name,
  implementationName: OperationLogLogsOperation.name,
})
