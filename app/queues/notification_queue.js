import Queue from "bull";

export const pushNotificationQueue = new Queue("notification", {
  redis: process.env.REDIS_URL,
});
