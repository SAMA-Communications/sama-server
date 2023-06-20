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

  async sendPushNotification(users_ids, request, message) {
    let devices = {};
    for (const id of users_ids) {
      const userDevices = await PushSubscription.findAll({ user_id: id });
      if (!userDevices.length) {
        continue;
      }
      devices[id] = userDevices;
    }

    if (!Object.keys(devices).length) {
      return;
    }

    const data = { devices };
    if (request.message && !message) {
      const m = request.message;
      let imgUrl = null;
      if (m.attachments?.length === 1) {
        imgUrl = await globalThis.storageClient.getDownloadUrl(
          m.attachments[0].file_id
        );
      } else if (m.attachments) {
        for (let i = 0; i < m.attachments.length; i++) {
          m.body += `\nImage`;
        }
      }

      data["message"] = {
        title: m.title,
        body: m.body,
        imgUrl,
        data: {
          conversationType: m.conversation_type,
          conversationId: m.conversation_id,
          userLogin: m.user_login,
        },
      };
    }
    message && (data["message"] = message);

    pushNotificationQueue.add(data);
  }

  async createPushEvent(recipients_ids, user_id, request, message) {
    const pushMessage = message || request;
    const pushEventParams = {
      user_id,
      recipients_ids,
      message: JSON.stringify(pushMessage),
    };

    const pushEvent = new PushEvents(pushEventParams);
    await pushEvent.save();

    await this.sendPushNotification(recipients_ids, request, pushMessage);

    return pushEvent.visibleParams();
  }
}
