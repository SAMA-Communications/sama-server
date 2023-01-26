import { createClient } from "redis";
import ClusterManager from "./../lib/node_sharing.js";

export default class RedisManager {
  constructor(params) {
    this.client = createClient({
      host: process.env.REDIS_HOSTNAME,
      port: process.env.REDIS_PORT,
    });
  }

  async publish(data) {
    // try {
    //   await this.client.publish(process.env.REDIS_HOSTNAME, data);
    // } catch (err) {
    //   console.log("Publish error", err);
    // }
  }

  async subscribe(nodes) {
    // for (const ip in nodes) {
    //   const nodeHostname = nodes[ip];
    //   await this.client.subscribe(nodeHostname, (message) => {
    //     console.log(message);
    //   });
    // }
  }

  async connect() {
    try {
      await this.client.connect();
      console.log("Redis connect success");
    } catch (err) {
      console.log("Redis connect error", err);
    }
  }
}
