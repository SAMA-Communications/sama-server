import { createClient } from "redis"

class RedisManager {
  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: retries => {
          if (retries > 10) {
            return new Error('Too many retries to connect to Redis');
          }
          return Math.min(retries * 100, 3000)
        }
      }
    })
  }

  async connect() {
    return await this.client.connect()
  }

  async scanWithPagination(type = "string", matchPattern = "*", offset = 0, limit = 10) {
    let cursor = 0
    let results = []
    let scanned = 0

    do {
      const response = await this.client.scan(cursor, { MATCH: matchPattern, TYPE: type })

      cursor = Number(response.cursor)
      const items = response.keys

      for (const item of items) {
        if (scanned >= offset) {
          results.push(item)
          if (results.length >= limit) {
            return results
          }
        }
        scanned++
      }
    } while (cursor !== 0 || !!cursor)

    return results
  }

  async countWithMatch(type = "string", matchPattern = "*") {
    let cursor = 0
    let matchCount = 0

    do {
      const response = await this.client.scan(cursor, { MATCH: matchPattern, TYPE: type })

      cursor = Number(response.cursor)
      matchCount += response.keys.length
    } while (cursor !== 0 || !!cursor)

    return matchCount
  }

  async findKeyByPattern(pattern) {
    const keys = await this.client.keys(pattern)

    return keys?.at(0)
  }
}

const RedisClient = new RedisManager()

export default RedisClient
