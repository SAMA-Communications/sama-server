import { createClient } from 'redis'

class RedisManager {
  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL,
    })
  }

  async connect() {
    try {
      await this.client.connect()
      console.log('[connectToRedis] Ok')
    } catch (err) {
      console.log('[connectToRedis] Fail', err)
    }
  }
}

const RedisClient = new RedisManager()

export default RedisClient
