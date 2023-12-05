import BaseRepository from "./base.js";
import RedisClient from "../lib/redis.js";
import { buildWsEndpoint } from "../utils/build_ws_endpoint.js";
import { splitWsEndpoint } from "../utils/split_ws_endpoint.js";

export default class SessionRepository extends BaseRepository {
  constructor(inMemoryStorage) {
    super(null, inMemoryStorage);
  }

  get sessionsTotal() {
    return this.inMemoryStorage.SESSIONS.size;
  }

  async addUserToList(userId, deviceId, nodeIp, nodePort) {
    await RedisClient.client.sAdd(
      `node:${buildWsEndpoint(nodeIp, nodePort)}`,
      JSON.stringify(userId + ":" + deviceId)
    );
  }

  async removeUserFromList(userId, deviceId, nodeIp, nodePort) {
    await RedisClient.client.sRem(
      `node:${buildWsEndpoint(nodeIp, nodePort)}`,
      JSON.stringify(userId + ":" + deviceId)
    );
  }

  async clearNodeUsersSession(nodeUrl) {
    const users = await RedisClient.client.sMembers(`node:${nodeUrl}`);
    if (!users.length) {
      return;
    }

    const [nodeIp, nodePort] = splitWsEndpoint(nodeUrl);
    users.forEach((u) => {
      const [userId, deviceId] = u.split(":");
      this.removeUserNodeData(userId, deviceId, nodeIp, nodePort);
    });

    await RedisClient.client.del(`node:${nodeUrl}`);
  }

  async storeUserNodeData(userId, deviceId, nodeIp, nodePort) {
    const userConnectsString = await this.getUserNodeData(userId);

    let isRecordFromThisDevice = false;
    let record = null;
    userConnectsString.forEach((d) => {
      const data = JSON.parse(d);
      if (Object.keys(data)[0] === "" + deviceId) {
        record = d;

        isRecordFromThisDevice = true;
        return;
      }
    });

    isRecordFromThisDevice && (await this.removeMember(userId, record));

    await RedisClient.client.sAdd(
      `user:${userId}`,
      JSON.stringify({
        [deviceId]: buildWsEndpoint(nodeIp, nodePort),
      })
    );

    await this.addUserToList(userId, deviceId, nodeIp, nodePort);
  }

  async removeUserNodeData(userId, deviceId, nodeIp, nodePort) {
    await RedisClient.client.sRem(
      `user:${userId}`,
      JSON.stringify({
        [deviceId]: buildWsEndpoint(nodeIp, nodePort),
      })
    );

    await this.removeUserFromList(userId, deviceId, nodeIp, nodePort);
  }

  async clearUserNodeData(userId) {
    await RedisClient.client.del(`user:${userId}`);
  }

  async getUserNodeData(userId) {
    return await RedisClient.client.sMembers(`user:${userId}`);
  }

  async dropUserNodeDataBase() {
    await RedisClient.client.flushDb();
  }

  async removeMember(userId, member) {
    return await RedisClient.client.sRem(`user:${userId}`, member);
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
        ?.deviceId;
    }
    return null;
  }
}
