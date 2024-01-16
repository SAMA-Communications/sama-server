import BaseRepository from './base.js'

import RedisClient from '../lib/redis.js'

class FileRepository extends BaseRepository {
  #generateKey(fileId) {
    return `file:${fileId}`
  }

  async getFileUrl(fileId) {
    const items = await RedisClient.client.sMembers(this.#generateKey(fileId))
    return items.at(0)
  }

  async storeFileUrl(fileId, url) {
    await RedisClient.client.sAdd(this.#generateKey(fileId), url)
    await RedisClient.client.expire(this.#generateKey(fileId), 3600)
  }
}

export default new FileRepository(null)
