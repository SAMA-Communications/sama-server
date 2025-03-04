import RegisterProvider from "../../../common/RegisterProvider.js"
import ClusterNodeService from "./index.js"

const name = "ClusterNodeService"

class ClusterNodeServiceRegisterProvider extends RegisterProvider {
  register(slc) {
    const clusterNodeRepo = slc.use("ClusterNodeRepository")

    return new ClusterNodeService(clusterNodeRepo)
  }
}

export default new ClusterNodeServiceRegisterProvider({ name, implementationName: ClusterNodeService.name })
