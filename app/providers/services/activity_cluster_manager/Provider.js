import RegisterProvider from "../../../common/RegisterProvider.js"
import ActivityClusterManagerService from "./index.js"

const name = "ActivityManagerService"

class ActivityClusterManagerServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const redisClient = slc.use("RedisClient")
    const userService = slc.use("UserService")

    return new ActivityClusterManagerService(redisClient, userService)
  }
}

export default new ActivityClusterManagerServiceRegisterProvider({ name, implementationName: ActivityClusterManagerService.name })
