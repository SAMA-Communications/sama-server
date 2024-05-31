import RegisterProvider from "../../../../common/RegisterProvider.js"
import ActivityUserUnsubscribeOperation from "./index.js"

const name = "ActivityUserUnsubscribeOperation"

class ActivityUserUnsubscribeOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const activityManagerService = slc.use("ActivityManagerService")

    return new ActivityUserUnsubscribeOperation(sessionService, activityManagerService)
  }
}

export default new ActivityUserUnsubscribeOperationRegisterProvider({
  name,
  implementationName: ActivityUserUnsubscribeOperation.name,
})
