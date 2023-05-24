import { createClient } from "redis";
import { buildRedisEndpoint } from "../utils/build_redis_enpoint.js";

class RedisManager {
  constructor() {
    this.client = createClient({
      url: buildRedisEndpoint(
        process.env.REDIS_HOSTNAME,
        process.env.REDIS_PORT
      ),
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
