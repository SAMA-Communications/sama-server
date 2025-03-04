import RegisterProvider from "../../../../common/RegisterProvider.js"
import PushEventCreateOperation from "./index.js"

const name = "PushEventCreateOperation"

class PushEventCreateOperationRegisterProvider extends RegisterProvider {
  register(slc) {
    const sessionService = slc.use("SessionService")
    const userService = slc.use("UserService")
    const pushNotificationService = slc.use("PushNotificationService")

    return new PushEventCreateOperation(sessionService, userService, pushNotificationService)
  }
}

export default new PushEventCreateOperationRegisterProvider({ name, implementationName: PushEventCreateOperation.name })
