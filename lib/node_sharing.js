import ClusterNode from "../models/cluster_node.js";
import ip from "ip";
import os from "os";
import { createTransitionSocket } from "../cluster/cluster_manager.js";

class ClusterManager {
  constructor(params) {
    //TODO: remove "process.env.REDIS_HOSTNAME"
    this.ip_address = ip.address() + process.env.REDIS_HOSTNAME;
    this.hostname = process.env.REDIS_HOSTNAME || os.hostname();
    this.port = process.env.CLUSTER_COMMUNICATION_PORT;

    this.nodes = {};

    this.nodesSyncInterval = null;
  }

  async retrieveExistingClusterNodes() {
    const nodeList = await ClusterNode.findAll({}, [
      "ip_address",
      "hostname",
      "port",
    ]);
    nodeList.forEach(async (n) => {
      this.nodes[n.ip_address] = n.hostname;
      if (this.port !== n.port && this.hostname < n.hostname)
        await createTransitionSocket(`ws://localhost:${n.port}/`);
    });
  }

  async startSyncingClusterNodes() {
    if (this.nodesSyncInterval) {
      return;
    }

    const storeCurrentNode = async ({ ip_address, hostname, port }) => {
      if (await ClusterNode.findOne({ ip_address, hostname, port })) {
        await ClusterNode.updateOne(
          { ip_address, hostname, port },
          {
            $set: { updated_at: new Date() },
          }
        );
      } else {
        const newNode = new ClusterNode({ ip_address, hostname, port });
        await newNode.save();
      }
    };

    const clusterNodeParams = {
      ip_address: this.ip_address,
      hostname: this.hostname,
      port: this.port,
    };
    await storeCurrentNode(clusterNodeParams);
    await this.retrieveExistingClusterNodes();

    const syncingFunc = async () => {
      await storeCurrentNode(clusterNodeParams);

      //update this node state in DB
      await ClusterNode.updateOne(clusterNodeParams, {
        $set: { updated_at: new Date() },
      });

      //get info about all node`s in DB
      this.nodes = {};
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

const ClusterClient = new ClusterManager();

export default ClusterClient;
