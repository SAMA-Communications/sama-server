import BaseJSONController from "./base.js";

import SessionRepository from "@sama/repositories/session_repository.js"
import User from "@sama/models/user.js"
import { ACTIVE } from "@sama/store/session.js"
import { ACTIVITY } from "@sama/store/activity.js"
import activityManager from "@sama/networking/activity_manager.js"

class LastActivitiesController extends BaseJSONController {
  constructor() {
    super();
    this.sessionRepository = new SessionRepository(ACTIVE);
  }

  async status_subscribe(ws, data) {
    const {
      id: requestId,
      user_last_activity_subscribe: { id: uId },
    } = data;

    const currentUId = this.sessionRepository.getSessionUserId(ws);
    const obj = {};

    if (ACTIVITY.SUBSCRIBED_TO[currentUId]) {
      activityManager.status_unsubscribe(ws);
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

  async status_unsubscribe(ws, data) {
    const { id: requestId } = data;
    
    await activityManager.status_unsubscribe(ws);

    return { response: { id: requestId, success: true } };
  }

  async get_user_status(ws, data) {
    const {
      id: requestId,
      user_last_activity: { ids: uIds },
    } = data;
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
