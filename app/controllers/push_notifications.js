import BaseController from "./base/base.js";
import PushEvent from "./../models/push_event.js";
import PushSubscription from "./../models/push_subscription.js";
import SessionRepository from "../repositories/session_repository.js";
import { ACTIVE } from "../store/session.js";
import { ERROR_STATUES } from "../validations/constants/errors.js";
import { sendPushNotification } from "../queues/notification_queue.js";

class PushNotificationsController extends BaseController {
  constructor() {
    super();

    this.sessionRepository = new SessionRepository(ACTIVE);
  }

  async pushSubscriptionCreate(ws, data) {
    const {
      id: requestId,
      push_subscription_create: {
        platform,
        web_endpoint,
        web_key_auth,
        web_key_p256dh,
        device_udid,
      },
    } = data;

    const userId = this.sessionRepository.getSessionUserId(ws);
    let pushSubscription = await PushSubscription.findOne({ device_udid });
    const existingPushToken = PushSubscription.findAll({ web_endpoint });

    if (existingPushToken.length > 1) {
      //update it and re-assign to current user
    }

    if (pushSubscription) {
      pushSubscription = new PushSubscription(
        PushSubscription.findOneAndUpdate(
          { device_udid, user_id: userId },
          { $set: { web_endpoint, web_key_auth, web_key_p256dh } }
        )
      );
    } else {
      data.push_subscription_create["user_id"] = userId;
      pushSubscription = new PushSubscription(data.push_subscription_create);
      await pushSubscription.save();
    }

    sendPushNotification({
      endpoint: web_endpoint,
      key_auth: web_key_auth,
      key_p256dh: web_key_p256dh,
    });

    return {
      response: {
        id: requestId,
        subscription: pushSubscription.visibleParams(),
      },
    };
  }

  async pushSubscriptionList(ws, data) {
    const { id: requestId } = data;

    const userId = this.sessionRepository.getSessionUserId(ws);
    const deviceId = this.sessionRepository.getDeviceId(ws, userId);

    const subscriptions = await PushSubscription.findAll({
      device_udid: deviceId,
    });

    return { response: { id: requestId, subscriptions: subscriptions } };
  }

  async pushSubscriptionDelete(ws, data) {
    const {
      id: requestId,
      push_subscription_delete: { id },
    } = data;

    const pushSubscriptionRecord = await PushSubscription.findOne({ _id: id });
    if (!pushSubscriptionRecord) {
      throw new Error(ERROR_STATUES.NOTIFICATION_NOT_FOUND.message, {
        cause: ERROR_STATUES.NOTIFICATION_NOT_FOUND,
      });
    }

    await pushSubscriptionRecord.delete();

    return { response: { id: requestId, success: true } };
  }

  async pushEventCreate(ws, data) {
    const {
      id: requestId,
      push_event_create: { recipients_ids, message },
    } = data;

    const userId = this.sessionRepository.getSessionUserId(ws);
    const pushEventParams = {
      user_id: userId,
      recipients_ids,
      message: JSON.stringify(message),
    };
    const pushEvent = new PushEvent(pushEventParams);

    await pushEvent.save();

    return {
      response: {
        id: requestId,
        event: pushEvent.visibleParams(),
      },
    };
  }
}

export default new PushNotificationsController();
