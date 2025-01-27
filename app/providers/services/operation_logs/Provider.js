import RegisterProvider from "../../../common/RegisterProvider.js"
import OperationLogsService from "./index.js"

const name = "OperationLogsService"

class OperationLogsServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const opLogsRepo = slc.use("OperationsLogRepository")

    return new OperationLogsService(opLogsRepo)
  }
}

export default new OperationLogsServiceRegisterProvider({ name, implementationName: OperationLogsService.name })
