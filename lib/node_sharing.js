import ClusterNode from "../models/cluster_node.js";

let clusterNodeList = {};

export default class NodeSharing {
  constructor({ ip_address, hostname }) {
    this.ip_address = ip_address;
    this.hostname = hostname;
    this.sharing = null;

    const newNode = new ClusterNode({ ip_address, hostname });
    newNode.save();
  }

  async startSharing() {
    if (this.sharing) {
      return;
    }

    const nodeList = await ClusterNode.findAll({});
    nodeList.forEach((n) => {
      clusterNodeList[n.ip_address] = n.hostname;
    });

    const sharingFunc = async () => {
      //update this node state in DB
      await ClusterNode.updateOne(
        { ip_address: this.ip_address, hostname: this.hostname },
        {
          $set: { updated_at: new Date() },
        }
      );

      //get info about all node`s in DB
      const nodeList = await ClusterNode.findAll({});
      clusterNodeList = {};
      nodeList.forEach((n) => {
        clusterNodeList[n.ip_address] = n.hostname;
      });
    };

    this.sharing = setInterval(
      sharingFunc,
      process.env.NODE_CLUSTER_DATA_EXPIRES_IN
    );
  }

  async stopSharing() {
    clearInterval(this.sharing);
    this.sharing = null;
  }
}

export { clusterNodeList };
