import RegisterProvider from "../../../../common/RegisterProvider.js"
import ActivityMarkActiveInactiveOperation from "./index.js"

const name = "ActivityMarkActiveInactiveOperation"

class ActivityMarkActiveInactiveOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")

    return new ActivityMarkActiveInactiveOperation(sessionService)
  }
}

export default new ActivityMarkActiveInactiveOperationRegisterProvider({
  name,
  implementationName: ActivityMarkActiveInactiveOperation.name,
  scope: RegisterProvider.SCOPE.TRANSIENT,
})
