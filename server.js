import { createClient } from "redis";

const redisClient = createClient();

try {
  await redisClient.connect();
  console.log("Redis connect success");
} catch (err) {
  console.log("Redis connect error", err);
}

export default redisClient;
