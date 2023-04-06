import BaseController from "./base/base.js";

class PushNotificationsController extends BaseController {
  constructor() {
    super();
  }

  async pushSubscriptionCreate(ws, data) {
    const {
      id: requestId,
      push_subscription_create: { platform, push_token, device_udid },
    } = data;
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
