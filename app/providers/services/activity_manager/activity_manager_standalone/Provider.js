import RegisterProvider from "../../../../common/RegisterProvider.js"
import ActivityManagerStandaloneService from "./index.js"

import { ACTIVITY } from "../../../../store/activity.js"

const name = "ActivityManagerStandaloneService"

class ActivityManagerStandaloneServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const userService = slc.use("UserService")

    return new ActivityManagerStandaloneService(ACTIVITY, userService)
  }
}

export default new ActivityManagerStandaloneServiceRegisterProvider({ name, implementationName: ActivityManagerStandaloneService.name })
