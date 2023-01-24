import { createClient } from "redis";

const redisClient = createClient({
  host: process.env.REDIS_HOSTNAME,
  port: process.env.REDIS_PORT,
});

try {
  await redisClient.connect();
  console.log("Redis connect success");
} catch (err) {
  console.log("Redis connect error", err);
}

export default redisClient;
