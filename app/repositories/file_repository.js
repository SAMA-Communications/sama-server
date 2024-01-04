import BaseRepository from "./base.js";
import RedisClient from "../lib/redis.js";

export default class FileRepository extends BaseRepository {
  constructor(inMemoryStorage) {
    super(null, inMemoryStorage);
  }

  #createKey(fileId) {
    return `file:${fileId}`;
  }

  async getFileUrl(fileId) {
    return (await RedisClient.client.sMembers(`file:${fileId}`))[0];
  }

  async storeFileUrl(fileId, url) {
    await RedisClient.client.sAdd(this.createKey(fileId), url);
    await RedisClient.client.expire(this.createKey(fileId), 3600);
  }
}
