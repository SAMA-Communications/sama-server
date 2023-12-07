import BaseRepository from '@sama/repositories/base.js'
import SessionRepository from '@sama/repositories/session_repository.js'
import { ACTIVE } from '@sama/store/session.js'

import PushEvent from '../models/push_event.js'
import PushSubscription from '../models/push_subscription.js'
import pushNotificationQueue from '../services/push_queue.js'

export default class PushNotificationsRepository extends BaseRepository {
  constructor() {
    super(null, null);

    this.sessionRepository = new SessionRepository(ACTIVE);
  }

  async addPushNotificationToQueueIfUsersOffline(userIds, pushMessage) {
    const recipients = []
    for (const uId of userIds) {
      const userNodeData = await this.sessionRepository.getUserNodeData(uId);

      if (!userNodeData?.length) {
        recipients.push(uId)
      }
    }

    await this.addPushNotificationToQueue(recipients, pushMessage)
  }

  async addPushNotificationToQueue(users_ids, message) {
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
    const data = { devices, message };
    await pushNotificationQueue.add(data);
  }

  async createPushEvent(recipients_ids, user_id, message) {
    const pushMessage = message;
    const pushEventParams = {
      user_id,
      recipients_ids,
      message: JSON.stringify(pushMessage),
    };

    const pushEvent = new PushEvent(pushEventParams);
    await pushEvent.save();

    await this.addPushNotificationToQueue(recipients_ids, pushMessage);

    return pushEvent.visibleParams();
  }
}
