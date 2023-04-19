import OpLog from "../models/operations_log.js";
import BaseRepository from "./base.js";
import { pushNotificationQueue } from "../queues/notification_queue.js";
import { default as PushNotificationsController } from "../controllers/push_notifications.js";

export default class OperationsLogRepository extends BaseRepository {
  constructor(model) {
    super(model, null);
  }
  async sendPushNotification(data) {
    const { id: requestId, uId: user_id, message } = data;
    const uDevices = (
      await PushNotificationsController.pushSubscriptionList(ws, {
        id: requestId,
        user_id,
      })
    )?.response.subscriptions;

    console.log(uDevices);
    pushNotificationQueue.add(
      { devices: uDevices, message },
      {} //options
    );
  }

  savePacket(user_id, packet) {
    const record = new OpLog({ user_id, packet });
    record.save();
  }
}
