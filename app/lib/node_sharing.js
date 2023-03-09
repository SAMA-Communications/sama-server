import ClusterNode from "../models/cluster_node.js";
import ip from "ip";
import os from "os";
import {
  createToNodeSocket,
  getClusterPort,
} from "../cluster/cluster_manager.js";
import SessionRepository from "../repositories/session_repository.js";
import { ACTIVE } from "../store/session.js";

class ClusterManager {
  constructor() {
    this.ip_address = ip.address();
    this.hostname = process.env.HOSTNAME || os.hostname();

    this.nodes = {};

    this.nodesSyncInterval = null;

    this.sessionRepository = new SessionRepository(ACTIVE);
  }

  async retrieveExistingClusterNodes() {
    const nodeList = await ClusterNode.findAll({}, [
      "ip_address",
      "hostname",
      "port",
    ]);

    nodeList.forEach(async (n) => {
      if (
        getClusterPort() !== n.port &&
        `${this.hostname}${getClusterPort()}` < `${n.hostname}${n.port}`
      )
        try {
          await createToNodeSocket(n.ip_address, n.port);
        } catch (err) {
          await this.sessionRepository.clearNodeUsersSession(
            buildWsEndpoint(n.ip_address, n.port)
          );
        }
    });
  }

  async startSyncingClusterNodes() {
    if (this.nodesSyncInterval) {
      return;
    }

    const storeCurrentNode = async ({
      ip_address,
      hostname,
      port,
      users_count,
    }) => {
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

    const clusterNodeParams = {
      ip_address: this.ip_address,
      hostname: this.hostname,
      port: getClusterPort(),
      users_count: this.sessionRepository.sessionsTotal,
    };
    await storeCurrentNode(clusterNodeParams);
    await this.retrieveExistingClusterNodes();

    const syncingFunc = async () => {
      await storeCurrentNode(clusterNodeParams);

      //update this node state in DB
      await ClusterNode.updateOne(clusterNodeParams, {
        $set: {
          updated_at: new Date(),
          users_count: this.sessionRepository.sessionsTotal,
        },
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
