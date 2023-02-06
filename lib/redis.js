import ClusterClient from "./node_sharing.js";
import { ACTIVE } from "../store/session.js";
import { createClient } from "redis";

class RedisManager {
  constructor() {
    this.client = createClient({
      host: process.env.REDIS_HOSTNAME,
      port: process.env.REDIS_PORT,
    });
  }

  async connect() {
    try {
      await this.client.connect();
      console.log("[connectToRedis] Ok");
    } catch (err) {
      console.log("[connectToRedis] Fail", err);
    }
  }
  async sMembers(uId) {
    return this.client.sMembers(`user:${uId}`);
  }

  async del(uId) {
    //when user close connect need to clear record
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
