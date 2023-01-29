import { createClient } from "redis";
import { ACTIVE } from "../store/session.js";
import ClusterClient from "./node_sharing.js";

class RedisManager {
  constructor(params) {
    this.client = createClient({
      host: process.env.REDIS_HOSTNAME,
      port: process.env.REDIS_PORT,
    });
  }

  async publish(chanel, data) {
    try {
      await this.client.publish(chanel || "TrashCan", JSON.stringify(data));
      console.log(`[${chanel}] Publish success`, data);
    } catch (err) {
      console.log(`[${chanel}] Publish data error`, err);
    }
  }

  async subscribe(nodes) {
    // console.log("Nodes: ", nodes);

    const subscriber = this.client.duplicate();
    await subscriber.connect();

    await subscriber.subscribe("G", (message) => {
      console.log("subMessage: ", message);
      const { userId, request } = JSON.parse(message);

      const wsRecipients = ACTIVE.DEVICES[userId];
      wsRecipients?.forEach((data) => {
        data.ws.send(JSON.stringify({ message: request }));
      });
    });
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
      await this.subscribe(ClusterClient.nodes);
      console.log("[connectToRedis] Ok");
    } catch (err) {
      console.log("[connectToRedis] Fail", err);
    }
  }
  async sMembers(uId) {
    return this.client.sMembers(`user:${uId}`);
  }

  async del(uId) {
    this.client.del(`user:${uId}`);
  }

  async sAdd(uId, data) {
    this.client.sAdd(`user:${uId}`, JSON.stringify(data));
  }

  async sRem(uId, data) {
    this.client.sRem(`user:${uId}`, JSON.stringify(data));
  }
}

const RedisClient = new RedisManager();

export default RedisClient;
