import Queue from "bull";

const pushNotificationQueue = new Queue("notification", {
  redis: {
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOSTNAME,
  },
});

const pushNotificationProcess = async (job) => {
  console.log(job.data);
};
pushNotificationQueue.process(pushNotificationProcess);

const sendPushNotification = (data) => {
  pushNotificationQueue.add(data, {});
};

sendPushNotification({
  endpoint: "enpoint",
  auth: "auth",
  p256dh: "p256dh",
});
