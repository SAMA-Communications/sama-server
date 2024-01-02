import ip from 'ip'
import os from 'os'

import clusterManager from './cluster_manager.js'

import ClusterNode from '../models/cluster_node.js'

import sessionRepository from '../repositories/session_repository.js'

class ClusterSyncer {
  constructor() {
    this.ip_address = ip.address()
    this.hostname = process.env.HOSTNAME || os.hostname()

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
        clusterManager.clusterPort !== n.port &&
        `${this.hostname}${clusterManager.clusterPort}` < `${n.hostname}${n.port}`
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
    const clusterNodeParams = {
      ip_address: this.ip_address,
      hostname: this.hostname,
      port: clusterManager.clusterPort,
      users_count: sessionRepository.sessionsTotal,
    }
    await this.#storeCurrentNode(clusterNodeParams)

    await this.#retrieveExistingClusterNodes()
  }
}

export default new ClusterSyncer()
