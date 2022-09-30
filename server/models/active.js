const ACTIVE = {
  SESSIONS: {},
  CONNECTIONS: {},
};
function getSessionUserId(ws) {
  if (ACTIVE.SESSIONS[ws]) {
    return ACTIVE.SESSIONS[ws].userSession.user_id.toString();
  }
  return null;
}
export { ACTIVE, getSessionUserId };
