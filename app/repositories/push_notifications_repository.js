import BaseRepository from "./base.js";
import PushEvents from "../models/push_event.js";
import PushSubscription from "../models/push_subscription.js";
import { pushNotificationQueue } from "../queues/notification_queue.js";

export default class PushNotificationsRepository extends BaseRepository {
  constructor(model) {
    super(model, null);
  }

  async sendPushNotification(user_id, message) {
    const devices = await PushSubscription.findAll({ user_id });
    if (!devices.length) {
      return;
    }
    pushNotificationQueue.add({ devices, message });
  }

  async createPushEvent(recipients_ids, message) {
    const userId = this.sessionRepository.getSessionUserId(ws);
    const pushEventParams = {
      user_id: userId,
      recipients_ids,
      message: JSON.stringify(message),
    };

    const pushEvent = new PushEvents(pushEventParams);
    await pushEvent.save();
  }
}
