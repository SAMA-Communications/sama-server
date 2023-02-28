import SessionRepository from "../repositories/session_repository.js";
import User from "../models/user.js";
import validate, { validateIsUserId } from "../lib/validation.js";
import { ACTIVE } from "../store/session.js";
import { ACTIVITY } from "../store/activity.js";

class LastActivitiesController {
  constructor() {
    this.sessionRepository = new SessionRepository(ACTIVE);
  }

  async statusSubscribe(ws, data) {
    const requestId = data.request.id;
    const uId = data.request.user_last_activity_subscribe.id;
    await validate(ws, { uId }, [validateIsUserId]);

    const currentUId = this.sessionRepository.getSessionUserId(ws);
    const obj = {};

    if (ACTIVITY.SUBSCRIBED_TO[currentUId]) {
      this.statusUnsubscribe(ws, { request: { id: requestId } });
    }
    ACTIVITY.SUBSCRIBED_TO[currentUId] = uId;

    if (!ACTIVITY.SUBSCRIBERS[uId]) {
      ACTIVITY.SUBSCRIBERS[uId] = {};
    }
    ACTIVITY.SUBSCRIBERS[uId][currentUId] = true;

    const activeSessions = await this.sessionRepository.getUserNodeData(uId);
    if (activeSessions.length) {
      obj[uId] = "online";
    } else {
      const uLastActivity = await User.findOne({ _id: uId });
      obj[uId] = uLastActivity.params.recent_activity;
    }

    return { response: { id: requestId, last_activity: obj } };
  }

  async statusUnsubscribe(ws, data) {
    const requestId = data.request.id;
    const currentUId = this.sessionRepository.getSessionUserId(ws);

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

    for (let i = 0; i < uLastActivities.length; i++) {
      const user = uLastActivities[i];
      const uId = user._id.toString();
      obj[uId] = !!(await this.sessionRepository.getUserNodeData(uId))
        ? "online"
        : user.recent_activity;
    }

    return { response: { id: requestId, last_activity: obj } };
  }
}

export default new LastActivitiesController();
