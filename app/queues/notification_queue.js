import Queue from "bull";

export const pushNotificationQueue = new Queue(
  "notification",
  process.env.REDIS_URL,
  {
    redis: {
      host: "redis",
      port: "6379",
    },
  }
);
