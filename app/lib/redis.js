import { createClient } from "redis"

import config from "../config/index.js"
import logger from "../logger/index.js"

class RedisManager {
  constructor() {
    this.client = createClient({
      url: config.get("redis.main.url"),
      socket: {
        reconnectStrategy: (retries) => {
          logger.warn("[Redis][reconnect] %s", retries)
          return 300
        },
      },
    })

    this.client.on("error", (err) => {
      logger.error(err, "[Redis][connection][error]")
    })

    this.client.on("end", () => {
      logger.warn("[Redis][connection][end]")
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
