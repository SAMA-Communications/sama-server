import User from "../models/user.js";
import { ACTIVE, getSessionUserId } from "../models/active.js";

export default class ActivityController {
  async subscribe(ws, data) {
    const requestId = data.request.id;
    const uId = data.request.user_last_activity_subscribe.id;
    const obj = {};

    if (Array.isArray(ACTIVE.SUBSRIBERS[uId])) {
      if (!ACTIVE.SUBSRIBERS[uId].includes(getSessionUserId(ws))) {
        ACTIVE.SUBSRIBERS[uId].push(getSessionUserId(ws));
      }
    } else {
      ACTIVE.SUBSRIBERS[uId] = [getSessionUserId(ws)];
    }

    if (!!ACTIVE.DEVICES[uId]) {
      obj[uId] = "online";
    } else {
      const uLastActivity = await User.findOne({ _id: uId });
      obj[uId] = uLastActivity.params.recent_activity;
    }

    return { response: { id: requestId, last_activity: obj } };
  }

  async status(ws, data) {
    const requestId = data.request.id;
    const uIds = data.request.user_last_activity.ids;
    const obj = {};

    const uLastActivities = await User.findAll({ _id: { $in: uIds } }, [
      "_id",
      "recent_activity",
    ]);
    for (const uId in uLastActivities) {
      obj[uId] = uLastActivities[uId].recent_activity;
    }

    return { response: { id: requestId, last_activity: obj } };
  }
}
