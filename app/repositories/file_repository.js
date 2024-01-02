import BaseRepository from "./base.js";
import RedisClient from "../lib/redis.js";

export default class FileRepository extends BaseRepository {
  constructor(inMemoryStorage) {
    super(null, inMemoryStorage);
  }

  async getFileUrl(fileId) {
    return await RedisClient.client.sMembers(`file:${fileId}`);
  }

  async storeFileUrl(fileId, url) {
    await RedisClient.client.sAdd(`file:${fileId}`, url);
    await RedisClient.client.expire(`file:${fileId}`, 3600);
  }
}
