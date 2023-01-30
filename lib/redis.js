import ClusterClient from "./node_sharing.js";
import { ACTIVE } from "../store/session.js";
import { createClient } from "redis";

class RedisManager {
  constructor(params) {
    this.client = createClient({
      host: process.env.REDIS_HOSTNAME,
      port: process.env.REDIS_PORT,
    });
    this.nodes = null;
    this.subscriber = null;
    this.subSyncInterval = null;
  }

  async publish(chanel, data) {
    try {
      await this.client.publish(chanel || "TrashCan", JSON.stringify(data));
      console.log(`[${chanel}] Publish success`, data);
    } catch (err) {
      console.log(`[${chanel}] Publish data error`, err);
    }
  }

  async subscribe() {
    this.nodes = ClusterClient.nodes;
    this.subscriber = this.client.duplicate();
    await this.subscriber.connect();

    for (const ip in this.nodes) {
      const nodeHostname = this.nodes[ip];
      //TODO: change ip -> nodeHostname
      console.log(`Sunscribed on node: ${ip}`);
      await this.subscriber.subscribe(ip, (message) => {
        console.log("subMessage: ", message);
        const { userId, request } = JSON.parse(message);

        const wsRecipients = ACTIVE.DEVICES[userId];
        wsRecipients?.forEach((data) => {
          data.ws.send(JSON.stringify({ message: request }));
        });
      });
    }
  }

  async unsubscribe(chanels) {
    await this.client.unsubscribe(chanels);
  }

  async getFieldsToUpdate(obj1, obj2) {
    const fieldsForSub = {};
    const fieldsForUnsub = Object.keys(obj1).filter(
      (f) => !Object.keys(obj2).includes(f)
    );

    for (const field in obj2) {
      if (!obj1[field]) {
        fieldsForSub[field] = obj2[field];
        continue;
      }

      if (obj1[field] !== obj2[field]) {
        fieldsForSub[field] = obj2[field];
      }
    }

    return { fieldsForSub, fieldsForUnsub };
  }

  async startSubscribe() {
    this.subSyncInterval = setInterval(async () => {
      console.log("Nodes: ", this.nodes, ClusterClient.nodes);

      //get different field for two object
      const { fieldsForSub, fieldsForUnsub } = await this.getFieldsToUpdate(
        this.nodes,
        ClusterClient.nodes
      );

      console.log("FiledsForSub: ", fieldsForSub);
      console.log("FiledsForUnsub: ", fieldsForUnsub);

      !fieldsForUnsub.length && (await this.unsubscribe(fieldsForUnsub));

      if (!Object.keys(fieldsForSub).length) {
        return;
      }

      for (const ip in fieldsForSub) {
        const nodeHostname = fieldsForSub[ip];
        //TODO: change ip -> nodeHostname
        console.log(`Sunscribed on node: ${ip}`);
        await this.subscriber.subscribe(ip, (message) => {
          console.log("subMessage: ", message);
          const { userId, request } = JSON.parse(message);

          const wsRecipients = ACTIVE.DEVICES[userId];
          wsRecipients?.forEach((data) => {
            data.ws.send(JSON.stringify({ message: request }));
          });
        });
      }

      this.nodes = ClusterClient.nodes;
    }, process.env.REDIS_SUB_DATA_EXPIRES_IN);
  }

  async stopSubscribe() {
    clearInterval(this.subSyncInterval);
    this.subSyncInterval = null;
  }

  async connect() {
    try {
      await this.client.connect();
      await this.subscribe();
      await this.startSubscribe();
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