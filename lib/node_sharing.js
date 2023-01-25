import ClusterNode from "../models/cluster_node.js";

// const ClusterNodeList = {};

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

    // async function sharingFunc() {}

    this.sharing = setInterval(
      async () =>
        await ClusterNode.updateOne(
          { ip_address: this.ip_address, hostname: this.hostname },
          {
            $set: { updated_at: new Date() },
          }
        ),
      process.env.NODE_CLUSTER_DATA_EXPIRES_IN
    );
  }

  async stopSharing() {
    clearInterval(this.sharing);
    this.sharing = null;
  }
}

// export { ClusterNodeList };
