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
}

const RedisClient = new RedisManager();

export default RedisClient;
