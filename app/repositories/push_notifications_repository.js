import BaseRepository from "./base.js";
import PushEvents from "../models/push_event.js";
import PushSubscription from "../models/push_subscription.js";
import SessionRepository from "./session_repository.js";
import { ACTIVE } from "../store/session.js";
import { pushNotificationQueue } from "../queues/notification_queue.js";

export default class PushNotificationsRepository extends BaseRepository {
  constructor(model) {
    super(model, null);

    this.sessionRepository = new SessionRepository(ACTIVE);
  }

  async sendPushNotification(user_id, message) {
    const devices = await PushSubscription.findAll({ user_id });
    if (!devices.length) {
      return;
    }
    pushNotificationQueue.add({ devices, message });
  }

  async createPushEvent(recipients_ids, user_id, message) {
    const pushEventParams = {
      user_id,
      recipients_ids,
      message: JSON.stringify(message),
    };

    const pushEvent = new PushEvents(pushEventParams);
    await pushEvent.save();

    recipients_ids.forEach((id) => this.sendPushNotification(id, message));

    return pushEvent.visibleParams();
  }
}
