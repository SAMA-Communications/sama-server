import User from "../models/user.js";
import validate, { validateIsUserId } from "../lib/validation.js";
import { ACTIVE, getSessionUserId } from "../store/session.js";
import { ACTIVITY } from "../store/activity.js";

export default class LastActivityController {
  async statusSubscribe(ws, data) {
    const requestId = data.request.id;
    const uId = data.request.user_last_activity_subscribe.id;
    await validate(ws, { uId }, [validateIsUserId]);

    const currentUId = getSessionUserId(ws);
    const obj = {};

    if (ACTIVITY.SUBSCRIBED_TO[currentUId]) {
      this.statusUnsubscribe(ws, { request: { id: requestId } });
    }
    ACTIVITY.SUBSCRIBED_TO[currentUId] = uId;

    if (!ACTIVITY.SUBSCRIBERS[uId]) {
      ACTIVITY.SUBSCRIBERS[uId] = {};
    }
    ACTIVITY.SUBSCRIBERS[uId][currentUId] = true;

    if (!!ACTIVE.DEVICES[uId]) {
      obj[uId] = "online";
    } else {
      const uLastActivity = await User.findOne({ _id: uId });
      obj[uId] = uLastActivity.params.recent_activity;
    }

    return { response: { id: requestId, last_activity: obj } };
  }

  async statusUnsubscribe(ws, data) {
    const requestId = data.request.id;
    const currentUId = getSessionUserId(ws);

    const oldTrackerUserId = ACTIVITY.SUBSCRIBED_TO[currentUId];
    const oldUserSubscribers = ACTIVITY.SUBSCRIBERS[oldTrackerUserId];
    delete ACTIVITY.SUBSCRIBED_TO[currentUId];

    if (oldUserSubscribers) {
      if (Object.keys(oldUserSubscribers).length <= 1) {
        delete ACTIVITY.SUBSCRIBERS[oldTrackerUserId];
      } else if (oldUserSubscribers[currentUId]) {
        delete ACTIVITY.SUBSCRIBERS[oldTrackerUserId][currentUId];
      }
    }

    return { response: { id: requestId, success: true } };
  }

  async getUserStatus(ws, data) {
    const requestId = data.request.id;
    const uIds = data.request.user_last_activity.ids;
    const obj = {};

    const uLastActivities = await User.findAll({ _id: { $in: uIds } }, [
      "_id",
      "recent_activity",
    ]);

    uLastActivities.forEach((u) => {
      const uId = u._id.toString();
      obj[uId] = !!ACTIVE.DEVICES[uId] ? "online" : u.recent_activity;
    });

    return { response: { id: requestId, last_activity: obj } };
  }
}
