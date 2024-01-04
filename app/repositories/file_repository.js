import BaseRepository from "./base.js";
import RedisClient from "../lib/redis.js";

export default class FileRepository extends BaseRepository {
  constructor(inMemoryStorage) {
    super(null, inMemoryStorage);
  }

  #generateKey(fileId) {
    return `file:${fileId}`;
  }

  async getFileUrl(fileId) {
    return (await RedisClient.client.sMembers(this.#generateKey(fileId)))[0];
  }

  async storeFileUrl(fileId, url) {
    await RedisClient.client.sAdd(this.#generateKey(fileId), url);
    await RedisClient.client.expire(this.#generateKey(fileId), 3600);
  }
}
