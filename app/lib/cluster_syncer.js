import ClusterNode from "../models/cluster_node.js";
import ip from "ip";
import os from "os";
import {
  createToNodeSocket,
  getClusterPort,
} from "../cluster/cluster_manager.js";
import SessionRepository from "../repositories/session_repository.js";
import { ACTIVE } from "../store/session.js";

class ClusterSyncer {
  constructor() {
    this.ip_address = ip.address();
    this.hostname = process.env.HOSTNAME || os.hostname();

    this.nodes = {};

    this.nodesSyncInterval = null;

    this.sessionRepository = new SessionRepository(ACTIVE);
  }

  async startSyncingClusterNodes() {
    if (this.nodesSyncInterval) {
      return;
    }

    this.#syncCluster();
    
    this.nodesSyncInterval = setInterval(
      () => {
        this.#syncCluster();
      },
      process.env.NODE_CLUSTER_DATA_EXPIRES_IN
    );
  }

  async stopSyncingClusterNodes() {
    clearInterval(this.nodesSyncInterval);
    this.nodesSyncInterval = null;
  }

  async #retrieveExistingClusterNodes() {
    const nodeList = await ClusterNode.findAll({}, [
      "ip_address",
      "hostname",
      "port",
    ]);

    // initiate connect to other node
    nodeList.forEach(async (n) => {
      if (
        getClusterPort() !== n.port &&
        `${this.hostname}${getClusterPort()}` < `${n.hostname}${n.port}`
      )
        try {
          await createToNodeSocket(n.ip_address, n.port);
        } catch (err) {
          console.log(err);
        }
    });

    this.nodes = nodeList;
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
      );
    } else {
      const newNode = new ClusterNode({
        ip_address,
        hostname,
        port,
        users_count,
      });
      await newNode.save();
    }
  };

  async #syncCluster() {
    const clusterNodeParams = {
      ip_address: this.ip_address,
      hostname: this.hostname,
      port: getClusterPort(),
      users_count: this.sessionRepository.sessionsTotal,
    };
    await this.#storeCurrentNode(clusterNodeParams);

    await this.#retrieveExistingClusterNodes();
  }
}

const ClusterSyncer = new ClusterSyncer();

export default ClusterSyncer;
