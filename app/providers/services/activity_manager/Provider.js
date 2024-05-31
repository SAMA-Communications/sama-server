import RegisterProvider from "../../../common/RegisterProvider.js"
import ActivityManagerService from "./index.js"

import { ACTIVITY } from "../../../store/activity.js"

const name = "ActivityManagerService"

class ActivityManagerServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const userService = slc.use("UserService")

    return new ActivityManagerService(ACTIVITY, userService)
  }
}

export default new ActivityManagerServiceRegisterProvider({ name, implementationName: ActivityManagerService.name })
