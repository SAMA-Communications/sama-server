import Queue from "bull";

const pushNotificationQueue = new Queue("notification", {
  redis: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOSTNAME,
  },
});

export function sendPushNotification(data) {
  pushNotificationQueue.add(data, {});
}
