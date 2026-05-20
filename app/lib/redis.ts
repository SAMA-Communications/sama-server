import { createClient, type RedisClientType } from "redis"

import config from "../config/index.js"
import mainLogger from "../logger/index.js"

const logger = mainLogger.child("[Redis]")

type RedisScanKeyType = "string" | "hash" | "set" | "zset" | "list"

class RedisManager {
  client: RedisClientType

  constructor() {
    this.client = createClient({
      url: config.get<string>("redis.main.url"),
      pingInterval: 3_000,
      socket: {
        reconnectStrategy: (retries: number): number => {
          logger.warn("[reconnect] %s", retries)
          return 300
        },
      },
    })

    this.client.on("error", (err: Error) => {
      logger.error(err, "[connection][error]")
    })

    this.client.on("end", () => {
      logger.warn("[connection][end]")
    })
  }

  async connect(): Promise<RedisClientType> {
    return await this.client.connect()
  }

  async scanWithPagination(
    type: RedisScanKeyType = "string",
    matchPattern: string = "*",
    offset: number = 0,
    limit: number = 10,
  ): Promise<string[]> {
    let cursor = 0
    const results: string[] = []
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

  async countWithMatch(type: RedisScanKeyType = "string", matchPattern: string = "*"): Promise<number> {
    let cursor = 0
    let matchCount = 0

    do {
      const response = await this.client.scan(cursor, { MATCH: matchPattern, TYPE: type })

      cursor = Number(response.cursor)
      matchCount += response.keys.length
    } while (cursor !== 0 || !!cursor)

    return matchCount
  }

  async findKeysByPattern(pattern: string): Promise<string[]> {
    const keys = await this.client.keys(pattern)

    if (!keys?.length) {
      return keys
    }

    return keys
  }
}

const RedisClient = new RedisManager()

export default RedisClient
export { RedisManager }
