import BaseController from "./base/base.js";
import PushNotificationsRepository from "../repositories/push_notifications_repository.js";
import PushSubscription from "./../models/push_subscription.js";
import SessionRepository from "../repositories/session_repository.js";
import User from "../models/user.js";
import { ACTIVE } from "../store/session.js";
import { ERROR_STATUES } from "../validations/constants/errors.js";
import { ObjectId } from "mongodb";

class PushNotificationsController extends BaseController {
  constructor() {
    super();

    this.sessionRepository = new SessionRepository(ACTIVE);
    this.pushNotificationsRepository = new PushNotificationsRepository(
      PushSubscription
    );
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
    let pushSubscription = new PushSubscription(
      (
        await PushSubscription.findOneAndUpdate(
          { device_udid, user_id: userId },
          { $set: { web_endpoint, web_key_auth, web_key_p256dh } }
        )
      )?.value
    );

    console.log(
      "[PushSubscritption] Exist record about pubsub:",
      pushSubscription
    );
    if (!pushSubscription.params) {
      data.push_subscription_create["user_id"] = new ObjectId(userId);
      pushSubscription = new PushSubscription(data.push_subscription_create);
      console.log("[PushSubscritption] Object to save:", pushSubscription);
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
    const {
      id: requestId,
      push_subscription_list: { user_id },
    } = data;

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
      push_event_create: { recipients_ids, request, message },
    } = data;

    const recipients = [];
    for (const id of recipients_ids) {
      const u = await User.findOne({ _id: id });
      !!u && recipients.push(id);
    }
    if (!recipients.length) {
      throw new Error(ERROR_STATUES.RECIPIENTS_NOT_FOUND.message, {
        cause: ERROR_STATUES.RECIPIENTS_NOT_FOUND,
      });
    }

    const userId = this.sessionRepository.getSessionUserId(ws);
    const pushEvent = await this.pushNotificationsRepository.createPushEvent(
      recipients,
      userId,
      request,
      message
    );

    return { response: { id: requestId, event: pushEvent } };
  }
}

export default new PushNotificationsController();
