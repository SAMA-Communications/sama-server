import User from "../models/user.js";
import { ACTIVE, getSessionUserId } from "../store/session.js";
import { ACTIVITY } from "../store/activity.js";

export default class LastActivityController {
  async statusSubscribe(ws, data) {
    const requestId = data.request.id;
    const uId = data.request.user_last_activity_subscribe.id;
    const currentUId = getSessionUserId(ws);
    const obj = {};

    if (ACTIVITY.SUBSCRIBED_TO[currentUId]) {
      this.statusUnsubscribe(ws, { request: { id: requestId } });
    }

    ACTIVITY.SUBSCRIBED_TO[currentUId] = uId;
    if (Array.isArray(ACTIVITY.SUBSCRIBERS[uId])) {
      if (!ACTIVITY.SUBSCRIBERS[uId].includes(currentUId)) {
        ACTIVITY.SUBSCRIBERS[uId].push(currentUId);
      }
    } else {
      ACTIVITY.SUBSCRIBERS[uId] = [currentUId];
    }

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

    if (oldUserSubscribers && oldUserSubscribers.includes(currentUId)) {
      if (ACTIVITY.SUBSCRIBERS[oldTrackerUserId].length === 1) {
        delete ACTIVITY.SUBSCRIBERS[oldTrackerUserId];
      } else {
        ACTIVITY.SUBSCRIBERS[oldTrackerUserId] = oldUserSubscribers.filter(
          (el) => el !== currentUId
        );
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
      obj[u._id] = uLastActivities[u._id].recent_activity;
    });

    return { response: { id: requestId, last_activity: obj } };
  }
}
