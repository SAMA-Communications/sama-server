import RedisClient from "../lib/redis.js";
import { ACTIVE } from "../store/session.js";
import { buildWsEndpoint } from "../utils/build_ws_enpdoint.js";

class SessionRepository {
  async storeUserNodeData(userId, deviceId, nodeIp, nodePort) {
    await RedisClient.client.sAdd(
      `user:${userId}`,
      JSON.stringify({
        [deviceId]: buildWsEndpoint(nodeIp, nodePort),
      })
    );
  }

  async removeUserNodeData(userId, deviceId, nodeIp, nodePort) {
    await RedisClient.client.sRem(
      `user:${userId}`,
      JSON.stringify({
        [deviceId]: buildWsEndpoint(nodeIp, nodePort),
      })
    );
  }

  async getUserNodeConnections(userId) {
    await RedisClient.client.sMembers(`user:${userId}`);
  }

  async clearUserNodeData(userId) {
    await RedisClient.client.del(`user:${userId}`);
  }

  getSessionUserId(ws) {
    if (ACTIVE.SESSIONS.get(ws)) {
      return ACTIVE.SESSIONS.get(ws).user_id.toString();
    }
    return null;
  }

  getDeviceId(ws, userId) {
    if (ACTIVE.DEVICES[userId]) {
      return ACTIVE.DEVICES[userId].find((el) => el.ws === ws).deviceId;
    }
    return null;
  }
}

const SessionController = new SessionRepository();

export default SessionController;
