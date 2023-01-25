import ClusterNode from "../models/cluster_node.js";
import os from "os";

const ClusterNodeList = {};

const nodeParams = {
  ip_address: "os.networkInterfaces()",
  hostname: "os.hostname()",
};

// console.log("node info: ", nodeParams);
const node = new ClusterNode(nodeParams);
console.log(await node.save());

let sharing;

function startSharing() {
  if (sharing) {
    return;
  }
  sharing = setInterval(sharingFunc, 30000);
}

async function sharingFunc() {
  await ClusterNode.updateOne(nodeParams, { $set: { updated_at: new Date() } });
}

function stopSharing() {
  clearInterval(sharing);
  sharing = null;
}

export { ClusterNodeList, startSharing, stopSharing };
