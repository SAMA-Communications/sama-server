import RuntimeDefinedContext from '../store/RuntimeDefinedContext.js'

import clusterManager from './cluster_manager.js'

import ClusterNode from '../models/cluster_node.js'

import ServiceLocatorContainer from '@sama/common/ServiceLocatorContainer.js'

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
    
    this.nodesSyncInterval = setInterval(
      () => {
        this.#syncCluster()
      },
      process.env.NODE_CLUSTER_DATA_EXPIRES_IN
    )
  }

  async stopSyncingClusterNodes() {
    clearInterval(this.nodesSyncInterval)
    this.nodesSyncInterval = null
  }

  async #retrieveExistingClusterNodes() {
    const nodeList = await ClusterNode.findAll({}, [
      'ip_address',
      'hostname',
      'port',
    ])

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

  async #storeCurrentNode({
    ip_address,
    hostname,
    port,
    users_count,
  }){
    if (await ClusterNode.findOne({ ip_address, hostname, port })) {
      await ClusterNode.updateOne(
        { ip_address, hostname, port },
        {
          $set: { updated_at: new Date(), users_count },
        }
      )
    } else {
      const newNode = new ClusterNode({
        ip_address,
        hostname,
        port,
        users_count,
      })
      await newNode.save()
    }
  }

  async #syncCluster() {
    const sessionService = ServiceLocatorContainer.use('SessionService')

    const clusterNodeParams = {
      ip_address: RuntimeDefinedContext.APP_IP,
      hostname: RuntimeDefinedContext.APP_HOSTNAME,
      port: RuntimeDefinedContext.CLUSTER_PORT,
      users_count: sessionService.sessionsTotal,
    }

    await this.#storeCurrentNode(clusterNodeParams)

    await this.#retrieveExistingClusterNodes()
  }
}

export default new ClusterSyncer()
