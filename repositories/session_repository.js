import BaseRepository from "./base.js";
import RedisClient from "../lib/redis.js";
import { buildWsEndpoint } from "../utils/build_ws_enpdoint.js";

export default class SessionRepository extends BaseRepository {
  constructor(inMemoryStorage) {
    super(null, inMemoryStorage);
  }

  get sessionsTotal() {
    return Object.keys(this.inMemoryStorage.SESSIONS).length;
  }

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

  async clearUserNodeData(userId) {
    await RedisClient.client.del(`user:${userId}`);
  }

  async getUserNodeData(userId) {
    return await RedisClient.client.sMembers(`user:${userId}`);
  }

  getSessionUserId(ws) {
    if (this.inMemoryStorage.SESSIONS.get(ws)) {
      return this.inMemoryStorage.SESSIONS.get(ws).user_id.toString();
    }
    return null;
  }

  getDeviceId(ws, userId) {
    if (this.inMemoryStorage.DEVICES[userId]) {
      return this.inMemoryStorage.DEVICES[userId].find((el) => el.ws === ws)
        .deviceId;
    }
    return null;
  }
}
