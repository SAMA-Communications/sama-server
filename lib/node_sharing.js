import ClusterNode from "../models/cluster_node.js";
import ip from "ip";
import os from "os";

let ClusterManager = {};

export default class NodeSharing {
  constructor(params) {
    this.ip_address = ip.address();
    this.hostname = os.hostname();
    this.sharing = null;
  }

  async saveNodeList() {
    const nodeList = await ClusterNode.findAll({});
    nodeList.forEach((n) => {
      ClusterManager[n.ip_address] = n.hostname;
    });
  }

  async startSyncingClusterNodes() {
    if (this.sharing) {
      return;
    }

    const newNode = new ClusterNode({
      ip_address: this.ip_address,
      hostname: this.hostname,
    });
    await newNode.save();
    await this.saveNodeList();

    const syncingFunc = async () => {
      //update this node state in DB
      await ClusterNode.updateOne(
        { ip_address: this.ip_address, hostname: this.hostname },
        {
          $set: { updated_at: new Date() },
        }
      );

      //get info about all node`s in DB
      ClusterManager = {};
      await this.saveNodeList();
    };

    this.sharing = setInterval(
      syncingFunc,
      process.env.NODE_CLUSTER_DATA_EXPIRES_IN
    );
  }

  async stopSyncingClusterNodes() {
    clearInterval(this.sharing);
    this.sharing = null;
  }
}

export { ClusterManager };
