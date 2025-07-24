import RedisClient from "./redis.js"
import Logger from "../utils/logger.js"

class RedisMonitor {
  constructor() {
    this.stats = {
      connectionAttempts: 0,
      successfulConnections: 0,
      failedConnections: 0,
      reconnections: 0,
      lastError: null,
      lastErrorTime: null,
      uptime: 0
    }
    
    this.startTime = Date.now()
    this.monitorInterval = null
  }

  startMonitoring() {
    Logger.monitor("Redis", "start", "Starting Redis connection monitoring...")
    
    this.monitorInterval = setInterval(() => {
      this.updateStats()
      this.logStats()
      this.checkConnectionHealth()
    }, 60000) // Check every minute
  }

  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null
      Logger.monitor("Redis", "stop", "Monitoring stopped")
    }
  }

  updateStats() {
    this.stats.uptime = Date.now() - this.startTime
  }

  logStats() {
    const uptimeHours = Math.floor(this.stats.uptime / (1000 * 60 * 60))
    const uptimeMinutes = Math.floor((this.stats.uptime % (1000 * 60 * 60)) / (1000 * 60))
    
    Logger.monitor("Redis", "stats", `Uptime: ${uptimeHours}h ${uptimeMinutes}m, ` +
                `Connections: ${this.stats.successfulConnections}/${this.stats.connectionAttempts}, ` +
                `Reconnections: ${this.stats.reconnections}, ` +
                `Failed: ${this.stats.failedConnections}`)
    
    if (this.stats.lastError) {
      const errorAge = Date.now() - this.stats.lastErrorTime
      const errorAgeMinutes = Math.floor(errorAge / (1000 * 60))
      Logger.monitor("Redis", "last-error", `Last error (${errorAgeMinutes}m ago): ${this.stats.lastError}`)
    }
  }

  async checkConnectionHealth() {
    try {
      if (!RedisClient.client.isReady) {
        Logger.monitorWarn("Redis", "health-check", "Client not ready, attempting health check...")
        return
      }

      const startTime = Date.now()
      await RedisClient.client.ping()
      const responseTime = Date.now() - startTime
      
      if (responseTime > 1000) {
        Logger.monitorWarn("Redis", "health-check", `Slow response time: ${responseTime}ms`)
      }
      
    } catch (error) {
      Logger.monitorError("Redis", "health-check", error)
      this.recordError(error)
    }
  }

  recordConnectionAttempt() {
    this.stats.connectionAttempts++
  }

  recordSuccessfulConnection() {
    this.stats.successfulConnections++
  }

  recordFailedConnection(error) {
    this.stats.failedConnections++
    this.recordError(error)
  }

  recordReconnection() {
    this.stats.reconnections++
  }

  recordError(error) {
    this.stats.lastError = error.message
    this.stats.lastErrorTime = Date.now()
  }

  getStats() {
    return { ...this.stats }
  }

  async getRedisInfo() {
    try {
      if (!RedisClient.client.isReady) {
        return { error: "Client not ready" }
      }

      const info = await RedisClient.client.info()
      return { info }
    } catch (error) {
      return { error: error.message }
    }
  }

  async getRedisMemoryUsage() {
    try {
      if (!RedisClient.client.isReady) {
        return { error: "Client not ready" }
      }

      const memory = await RedisClient.client.memory('USAGE')
      return { memory }
    } catch (error) {
      return { error: error.message }
    }
  }
}

const redisMonitor = new RedisMonitor()

export default redisMonitor 