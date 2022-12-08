import User from "../models/user.js";

const ACTIVE = {
  SESSIONS: new Map(),
  DEVICES: {},
  SUBSCRIBED_TO: {},
  SUBSCRIBERS: {},
};

function getSessionUserId(ws) {
  if (ACTIVE.SESSIONS.get(ws)) {
    return ACTIVE.SESSIONS.get(ws).user_id.toString();
  }
  return null;
}
function getDeviceId(ws, userId) {
  if (ACTIVE.DEVICES[userId]) {
    return ACTIVE.DEVICES[userId].find((el) => el.ws === ws).deviceId;
  }
  return null;
}
function deliverActivityToUsers(ws, uId, activity) {
  const arrSubscribers = ACTIVE.SUBSCRIBERS[uId];
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

async function updateAndSendUserActivity(ws, uId) {
  const t = Math.round(Date.now() / 1000);
  await User.updateOne({ _id: uId }, { $set: { recent_activity: t } });

  if (ACTIVE.SUBSCRIBERS[uId]) {
    deliverActivityToUsers(ws, uId, t);
  }
}

export {
  ACTIVE,
  getSessionUserId,
  getDeviceId,
  deliverActivityToUsers,
  updateAndSendUserActivity,
};
