import BaseController from "./base/base.js";
import PushEvent from "./../models/push_event.js";
import PushSubscription from "./../models/push_subscription.js";
import SessionRepository from "../repositories/session_repository.js";
import { ACTIVE } from "../store/session.js";
import { ERROR_STATUES } from "../validations/constants/errors.js";
import { ObjectId } from "mongodb";

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
    //only device_id??
    let pushSubscription = await PushSubscription.findOne({ device_udid });
    const existingPushToken = await PushSubscription.findAll({ web_endpoint });

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
      data.push_subscription_create["user_id"] = new ObjectId(userId);
      pushSubscription = new PushSubscription(data.push_subscription_create);
      await pushSubscription.save();
    }

    return {
      response: {
        id: requestId,
        subscription: pushSubscription.visibleParams(),
      },
    };
  }

  async pushSubscriptionList(ws, data) {
    const { id: requestId, user_id } = data;

    const subscriptions = await PushSubscription.findAll({ user_id });

    return { response: { id: requestId, subscriptions } };
  }

  async pushSubscriptionDelete(ws, data) {
    const {
      id: requestId,
      push_subscription_delete: { device_udid },
    } = data;

    const userId = this.sessionRepository.getSessionUserId(ws);
    const pushSubscriptionRecord = await PushSubscription.findOne({
      device_udid,
      user_id: userId,
    });
    console.log("pushSubscriptionRecord: ", pushSubscriptionRecord);
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
