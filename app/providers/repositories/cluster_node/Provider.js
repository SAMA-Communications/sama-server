import RegisterProvider from "../../../common/RegisterProvider.js"
import ClusterNode from "../../../models/cluster_node.js"
import ClusterNodeRepository from "./index.js"

const name = "ClusterNodeRepository"

class ClusterNodeRepositoryRegisterProvider extends RegisterProvider {
  register(slc) {
    const mongoConnection = slc.use("MongoConnection")
    const baseMapper = slc.use("BaseMapper")

    return new ClusterNodeRepository(mongoConnection, ClusterNode, baseMapper)
  }
}

export default new ClusterNodeRepositoryRegisterProvider({ name, implementationName: ClusterNodeRepository.name })
