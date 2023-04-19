import Queue from "bull";

export const pushNotificationQueue = new Queue("notification", {
  redis: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOSTNAME,
  },
});
