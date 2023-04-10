import BaseController from "./base/base.js";
import PushSubscription from "./../models/push_subscription.js";
import webPush from "web-push";

class PushNotificationsController extends BaseController {
  constructor() {
    super();
  }

  // async sendNotification(push_token) {
  //   webPush.setVapidDetails(
  //     "mailto:test@test.com",
  //     process.env.PUBLIC_VAPID_KEY,
  //     process.env.PRIVATE_VAPID_KEY
  //   );
  //   const pushSubscription = {
  //     endpoint: push_token,
  //     keys: {
  //       p256dh: "< User Public Encryption Key >",
  //       auth: "< User Auth Secret >",
  //     },
  //   };
  //   const payload = JSON.stringify({ title: "Login is succes!" });
  //   webPush.sendNotification(push_token, payload);
  // }

  async pushSubscriptionCreate(ws, data) {
    const {
      id: requestId,
      push_subscription_create: { platform, push_token, device_udid },
    } = data;

    let pushSubscription = await PushSubscription.findOne({ device_udid });
    const existingPushToken = PushSubscription.findAll({ push_token });

    if (existingPushToken.length > 1) {
      //update it and re-assign to current user
    }

    if (pushSubscription) {
      pushSubscription = new PushSubscription(
        PushSubscription.findOneAndUpdate(
          { device_udid },
          { $set: { push_token } }
        )
      );
    } else {
      pushSubscription = new PushSubscription(data.push_subscription_create);
      await pushSubscription.save();
    }

    return {
      response: {
        id: requestId,
        pushSubscription: pushSubscription.visibleParams(),
      },
    };
  }

  async pushSubscriptionList(ws, data) {
    const { id: requestId } = data;
  }

  async pushSubscriptionDelete(ws, data) {
    const {
      id: requestId,
      push_subscription_delete: { id },
    } = data;
  }

  async pushEventCreate(ws, data) {
    const {
      id: requestId,
      push_event_create: { recipients_ids, message },
    } = data;
  }
}

export default new PushNotificationsController();
