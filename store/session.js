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

export { ACTIVE, getSessionUserId, getDeviceId };
