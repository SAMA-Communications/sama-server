import { ACTIVE, getSessionUserId } from "./session.js";
import BaseModel from "../models/base/base.js";
import User from "../models/user.js";

const ACTIVITY = {
  SUBSCRIBED_TO: {},
  SUBSCRIBERS: {},
};

class Activity extends BaseModel {
  constructor(params) {
    super(params);
  }

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

function deliverActivityToUsers(ws, uId, activity) {
  const arrSubscribers = ACTIVITY.SUBSCRIBERS[uId];
  const request = { last_activity: {} };
  request.last_activity[uId] = activity;

  arrSubscribers.forEach((userId) => {
    const wsRecipient = ACTIVE.DEVICES[userId];

    if (wsRecipient) {
      wsRecipient.forEach((data) => {
        if (data.ws !== ws) {
          data.ws.send(JSON.stringify(request));
        }
      });
    }
  });
  return null;
}

async function maybeUpdateAndSendUserActivity(ws, { uId, rId }, status) {
  if (ACTIVITY.SUBSCRIBERS[uId]) {
    if (status === "online") {
      if (!ACTIVE.DEVICES[uId]?.length) {
        await User.updateOne(
          { _id: uId },
          { $set: { recent_activity: status } }
        );
      }
    } else {
      await User.updateOne(
        { _id: uId },
        { $set: { recent_activity: Math.round(new Date() / 1000) } }
      );
      await new Activity().statusUnsubscribe(ws, {
        request: { id: rId || "Unsubscribe" },
      });
    }

    deliverActivityToUsers(ws, uId, status || Math.round(new Date() / 1000));
  }
}

export default Activity;
export { ACTIVITY, deliverActivityToUsers, maybeUpdateAndSendUserActivity };
