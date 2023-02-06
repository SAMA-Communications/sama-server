import OfflineQueue from "../models/offline_queue.js";

const ACTIVE = {
  SESSIONS: new Map(),
  DEVICES: {},
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

function saveRequestInOfflineQueue(user_id, request) {
  const record = new OfflineQueue({ user_id, request });
  record.save();
}

export { ACTIVE, getSessionUserId, getDeviceId, saveRequestInOfflineQueue };
