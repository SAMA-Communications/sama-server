import Queue from "bull";

export const pushNotificationQueue = new Queue(
  "notification",
  process.env.REDIS_URL
);
