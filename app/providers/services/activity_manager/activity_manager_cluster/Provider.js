import RegisterProvider from "../../../../common/RegisterProvider.js"
import ActivityManagerClusterService from "./index.js"

const name = "ActivityManagerClusterService"

class ActivityManagerClusterServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const redisClient = slc.use("RedisClient")
    const userService = slc.use("UserService")

    return new ActivityManagerClusterService(redisClient, userService)
  }
}

export default new ActivityManagerClusterServiceRegisterProvider({ name, implementationName: ActivityManagerClusterService.name })
