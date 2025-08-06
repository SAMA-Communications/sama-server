import RegisterProvider from "../../../../common/RegisterProvider.js"
import OpLogsListOperation from "./index.js"

const name = "OpLogsListOperation"

class OpLogsListOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const opLogsService = slc.use("OperationLogsService")

    return new OpLogsListOperation(sessionService, opLogsService)
  }
}

export default new OpLogsListOperationRegisterProvider({
  name,
  implementationName: OpLogsListOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
