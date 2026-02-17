import process from "node:process"
import prettyMs from "pretty-ms"

class StatsService {
  messagesPerMinute = 0
  messagesPerHour = 0
  messagesPerDay = 0

  constructor(config, sessionService) {
    this.config = config
    this.sessionService = sessionService
  }

  static ONE_MINUTE_IN_MS = 60 * 1_000
  static ONE_HOUR_IN_MS = this.ONE_MINUTE_IN_MS * 60
  static ONE_DAY_IN_MS = this.ONE_HOUR_IN_MS * 24

  incMessagesCount(inc = 1) {
    inc = this.normalizeInc(inc)

    this.messagesPerMinute += inc
    this.messagesPerHour += inc 
    this.messagesPerDay += inc
  }

  normalizeInc(inc) {
    const parsed = parseInt(inc, 10)

    return isNaN(parsed) ? 0 : parsed
  }

  collectServerStats(format) {
    const uptime = Math.floor(process.uptime())

    const formattedUptime = format ? prettyMs(uptime * 1000) : uptime

    return {
      uptime: formattedUptime
    }
  }

  collectUsersStats(format) {
    return {
      online_users: this.sessionService.totalSessions()
    }
  }

  collectChatStats(format) {
    return {
      messages_per_minute: this.messagesPerMinute,
      messages_per_hour: this.messagesPerHour,
      messages_per_day: this.messagesPerDay
    }
  }

  collectStats(format) {
    const stats = {}

    const serverStats = this.collectServerStats(format)
    const usersStats = this.collectUsersStats(format)
    const chatStats = this.collectChatStats(format)

    return Object.assign(stats, serverStats, usersStats, chatStats)
  }

  resetPerMinute() {
    this.messagesPerMinute = 0
  }

  resetPerHour() {
    this.messagesPerHour = 0
  }

  resetPerDay() {
    this.messagesPerDay = 0
  }

  resetChatStatsAll() {
    this.resetPerMinute()
    this.resetPerHour()
    this.resetPerDay()
  }

  boot() {
    this.startResetLastMinute()
    this.startResetLastHour()
    this.startResetLastDay()
  }

  startResetLastMinute() {
    this.schedule(() => {
      this.resetPerMinute()
    }, StatsService.ONE_MINUTE_IN_MS)
  }

  startResetLastHour() {
    this.schedule(() => {
      this.resetPerHour()
    }, StatsService.ONE_HOUR_IN_MS)
  }

  startResetLastDay() {
    this.schedule(() => {
      this.resetPerDay()
    }, StatsService.ONE_DAY_IN_MS)
  }

  schedule(fun, delay) {
    return setInterval(fun, delay)
  }
}

export default StatsService
