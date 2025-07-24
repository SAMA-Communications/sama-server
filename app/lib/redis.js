import { createClient } from "redis"

import config from "../config/index.js"
import redisMonitor from "./redis-monitor.js"
import Logger from "../utils/logger.js"

class RedisManager {
  constructor() {
    this.client = createClient({
      url: config.get("redis.main.url"),
      socket: {
        reconnectStrategy: (retries) => {
          Logger.redis("reconnect", "attempt", retries)

          const delay = Math.min(Math.pow(2, retries) * 1000, 30000)
          Logger.redis("reconnect", "waiting", `Attempt ${retries}, waiting ${delay}ms`)
          return delay
        },
        connectTimeout: 10000,
        lazyConnect: true,
        keepAlive: 30000,
        noDelay: true,
      },
      // Add retry strategy for commands
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.warn('[Redis][retry] Connection refused, retrying...')
          return Math.min(options.attempt * 1000, 30000)
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          console.error('[Redis][retry] Retry time exhausted')
          return new Error('Retry time exhausted')
        }
        if (options.attempt > 10) {
          console.error('[Redis][retry] Max retry attempts reached')
          return undefined
        }
        return Math.min(options.attempt * 1000, 30000)
      }
    })

    this.client.on("error", (err) => {
      Logger.redisError("connection", "error", err)
      redisMonitor.recordError(err)
    })

    this.client.on("end", () => {
      Logger.redisWarn("connection", "end", "Connection ended")
    })

    this.client.on("connect", () => {
      Logger.redis("connection", "connect", "Connected to Redis")
      redisMonitor.recordSuccessfulConnection()
    })

    this.client.on("ready", () => {
      Logger.redis("connection", "ready", "Redis client ready")
    })

    this.client.on("reconnecting", () => {
      Logger.redis("connection", "reconnecting", "Attempting to reconnect...")
      redisMonitor.recordReconnection()
    })

    this.connectionHealthCheck()
  }

  async connectionHealthCheck() {
    setInterval(async () => {
      try {
        if (this.client.isReady) {
          await this.client.ping()
          Logger.redis("health-check", "success", "Connection health check successful")
        }
      } catch (error) {
        Logger.redisWarn("health-check", "failed", `Connection health check failed: ${error.message}`)
      }
    }, 30000) // Check every 30 seconds
  }

  async connect() {
    try {
      redisMonitor.recordConnectionAttempt()
      await this.client.connect()
      Logger.redis("connect", "success", "Successfully connected")
      redisMonitor.startMonitoring()
    } catch (error) {
      Logger.redisError("connect", "failed", error)
      redisMonitor.recordFailedConnection(error)
      throw error
    }
  }

  async disconnect() {
    try {
      redisMonitor.stopMonitoring()
      await this.client.disconnect()
      Logger.redis("disconnect", "success", "Successfully disconnected")
    } catch (error) {
      Logger.redisError("disconnect", "failed", error)
    }
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
