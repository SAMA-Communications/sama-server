import config from "../config/index.js"
import logger from "../logger/index.js"

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
    }, config.get("ws.cluster.nodeExpiresIn"))
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
        config.get("ws.cluster.port") !== n.port &&
        `${config.get("app.hostName")}${config.get("ws.cluster.port")}` < `${n.hostname}${n.port}`
      )
        try {
          await clusterManager.createSocketWithNode(n.ip_address, n.port)
        } catch (err) {
          logger.error(err)
        }
    })

    this.nodes = nodeList

    // TODO
    // if some node is gone, we may need to do some cleaning ?
  }

  async #storeCurrentNode(usersCount) {
    const clusterNodeService = ServiceLocatorContainer.use("ClusterNodeService")

    const addressParams = {
      ip_address: config.get("app.ip"),
      hostname: config.get("app.hostName"),
      port: config.get("ws.cluster.port"),
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
