import RuntimeDefinedContext from "../store/RuntimeDefinedContext.js"

import clusterManager from "./cluster_manager.js"

import ServiceLocatorContainer from "@sama/common/ServiceLocatorContainer.js"

class ClusterSyncer {
  constructor() {
    this.nodes = {}

    this.nodesSyncInterval = null
  }

  async startSyncingClusterNodes() {
    if (this.nodesSyncInterval) {
      return
    }

    this.#syncCluster()

    this.nodesSyncInterval = setInterval(() => {
      this.#syncCluster()
    }, process.env.NODE_CLUSTER_DATA_EXPIRES_IN)
  }

  async stopSyncingClusterNodes() {
    clearInterval(this.nodesSyncInterval)
    this.nodesSyncInterval = null
  }

  async #retrieveExistingClusterNodes() {
    const clusterNodeService = ServiceLocatorContainer.use("ClusterNodeService")
    const nodeList = await clusterNodeService.retrieveAll()

    // initiate connect to other node
    nodeList.forEach(async (n) => {
      if (
        RuntimeDefinedContext.CLUSTER_PORT !== n.port &&
        `${RuntimeDefinedContext.APP_HOSTNAME}${RuntimeDefinedContext.CLUSTER_PORT}` < `${n.hostname}${n.port}`
      )
        try {
          await clusterManager.createSocketWithNode(n.ip_address, n.port)
        } catch (err) {
          console.log(err)
        }
    })

    this.nodes = nodeList

    // TODO
    // if some node is gone, we may need to do some cleaning ?
  }

  async #storeCurrentNode(usersCount) {
    const clusterNodeService = ServiceLocatorContainer.use("ClusterNodeService")

    const addressParams = {
      ip_address: RuntimeDefinedContext.APP_IP,
      hostname: RuntimeDefinedContext.APP_HOSTNAME,
      port: RuntimeDefinedContext.CLUSTER_PORT,
    }

    const optionalParams = {
      users_count: usersCount,
    }

    await clusterNodeService.create(addressParams, optionalParams)
  }

  async #syncCluster() {
    const sessionService = ServiceLocatorContainer.use("SessionService")

    await this.#storeCurrentNode(sessionService.sessionsTotal)

    await this.#retrieveExistingClusterNodes()
  }
}

export default new ClusterSyncer()
