import LastActivityiesController from "../controllers/activities.js";
import User from "../models/user.js";
import { ACTIVE } from "./session.js";

const ACTIVITY = {
  SUBSCRIBED_TO: {},
  SUBSCRIBERS: {},
};

function deliverActivityStatusToSubscribers(ws, uId, activity) {
  const arrSubscribers = Object.keys(ACTIVITY.SUBSCRIBERS[uId]);
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
  if (!ACTIVITY.SUBSCRIBERS[uId]) {
    return;
  }

  if (status !== "online") {
    await User.updateOne(
      { _id: uId },
      { $set: { recent_activity: Math.round(new Date() / 1000) } }
    );
    await new LastActivityiesController().statusUnsubscribe(ws, {
      request: { id: rId || "Unsubscribe" },
    });
  }

  //todo: check userDevices
  deliverActivityStatusToSubscribers(
    ws,
    uId,
    status || Math.round(new Date() / 1000)
  );
}

export { ACTIVITY, maybeUpdateAndSendUserActivity };
