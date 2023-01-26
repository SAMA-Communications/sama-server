import ClusterNode from "../models/cluster_node.js";
import ip from "ip";
import os from "os";

let nodesSyncInterval = {};

export default class ClusterManager {
  constructor(params) {
    this.ip_address = ip.address();
    this.hostname = os.hostname();
    this.nodesSyncInterval = null;
  }

  async retrieveExistingClusterNodes() {
    const nodeList = await ClusterNode.findAll({});
    nodeList.forEach((n) => {
      nodesSyncInterval[n.ip_address] = n.hostname;
    });
  }

  async startSyncingClusterNodes() {
    if (this.nodesSyncInterval) {
      return;
    }

    const clusterNodeParams = {
      ip_address: this.ip_address,
      hostname: this.hostname,
    };
    if (await ClusterNode.findOne(clusterNodeParams)) {
      await ClusterNode.updateOne(clusterNodeParams, {
        $set: { updated_at: new Date() },
      });
    } else {
      const newNode = new ClusterNode(clusterNodeParams);
      await newNode.save();
    }
    await this.retrieveExistingClusterNodes();

    const syncingFunc = async () => {
      //update this node state in DB
      await ClusterNode.updateOne(clusterNodeParams, {
        $set: { updated_at: new Date() },
      });

      //get info about all node`s in DB
      nodesSyncInterval = {};
      await this.retrieveExistingClusterNodes();
    };

    this.nodesSyncInterval = setInterval(
      syncingFunc,
      process.env.NODE_CLUSTER_DATA_EXPIRES_IN
    );
  }

  async stopSyncingClusterNodes() {
    clearInterval(this.nodesSyncInterval);
    this.nodesSyncInterval = null;
  }
}

export { nodesSyncInterval };
