import BaseController from "./base/base.js";

class PushNotificationsController extends BaseController {
  constructor() {
    super();
  }

  async push_subscription_create(ws, data) {}
  async push_subscription_list(ws, data) {}
  async push_subscription_delete(ws, data) {}
  async push_event_create(ws, data) {}
}

export default new PushNotificationsController();
