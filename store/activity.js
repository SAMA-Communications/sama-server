import { ACTIVE, getSessionUserId } from "./active.js";
import BaseModel from "../models/base/base.js";
import User from "../models/user.js";

export default class Activity extends BaseModel {
  constructor(params) {
    super(params);
  }

  async statusSubscribe(ws, data) {
    const requestId = data.request.id;
    const uId = data.request.user_last_activity_subscribe.id;
    const currentUId = getSessionUserId(ws);
    const obj = {};

    this.statusUnsubscribe(ws, { request: { id: requestId } });

    ACTIVE.SUBSCRIBED_TO[currentUId] = uId;
    if (Array.isArray(ACTIVE.SUBSCRIBERS[uId])) {
      if (!ACTIVE.SUBSCRIBERS[uId].includes(currentUId)) {
        ACTIVE.SUBSCRIBERS[uId].push(currentUId);
      }
    } else {
      ACTIVE.SUBSCRIBERS[uId] = [currentUId];
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

    const oldTrackerUserId = ACTIVE.SUBSCRIBED_TO[currentUId];
    const oldUserSubscribers = ACTIVE.SUBSCRIBERS[oldTrackerUserId];
    delete ACTIVE.SUBSCRIBED_TO[currentUId];

    if (oldUserSubscribers && oldUserSubscribers.includes(currentUId)) {
      if (ACTIVE.SUBSCRIBERS[oldTrackerUserId].length === 1) {
        delete ACTIVE.SUBSCRIBERS[oldTrackerUserId];
      } else {
        ACTIVE.SUBSCRIBERS[oldTrackerUserId] = oldUserSubscribers.filter(
          (el) => el !== currentUId
        );
      }
    }

    return { response: { id: requestId, success: true } };
  }

  async getUsersActivity(ws, data) {
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
