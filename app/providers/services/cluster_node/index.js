class ClusterNodeService {
  constructor(clusterNodeRepo) {
    this.clusterNodeRepo = clusterNodeRepo
  }

  async retrieveAll() {
    const clusterNodes = await this.clusterNodeRepo.findAll({})

    return clusterNodes
  }

  async create(addressParams, optionalParams) {
    const clusterNodeParams = Object.assign({}, addressParams, optionalParams)

    const clusterNode = await this.clusterNodeRepo.create(clusterNodeParams)

    return clusterNode
  }

  async upsert(addressParams, optionalParams) {
    const existedNode = await this.clusterNodeRepo.findOne(addressParams)
    
    if (existedNode) {
      await this.clusterNodeRepo.updateStats(existedNode._id, optionalParams)

      return
    }

    await this.create(addressParams, optionalParams)
  }
}

export default ClusterNodeService
