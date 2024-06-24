import RegisterProvider from "../../../../common/RegisterProvider.js"
import ActivityUserRetrieveOperation from "./index.js"

const name = "ActivityUserRetrieveOperation"

class ActivityUserRetrieveOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")

    return new ActivityUserRetrieveOperation(sessionService, userService)
  }
}

export default new ActivityUserRetrieveOperationRegisterProvider({
  name,
  implementationName: ActivityUserRetrieveOperation.name,
})
