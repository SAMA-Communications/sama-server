import RegisterProvider from "../../../common/RegisterProvider.js"
import ClusterNodeService from "./index.js"

const name = "ClusterNodeService"

class ClusterNodeServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const config = slc.use("Config")
    const redisClient = slc.use("RedisClient")

    return new ClusterNodeService(config, redisClient)
  }
}

export default new ClusterNodeServiceRegisterProvider({ name, implementationName: ClusterNodeService.name })
