import process from "node:process"
import cron from "node-cron"
import prettyMs from "pretty-ms"

class StatsService {
  messagesPerMinute = 0
  messagesPerHour = 0
  messagesPerDay = 0

  constructor(config, sessionService) {
    this.config = config
    this.sessionService = sessionService
  }

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
    cron.schedule("0 * * * * *", () => {
      this.resetPerMinute()
    }, { name: "ResetLastMinuteStats" })
  }

  startResetLastHour() {
    cron.schedule("0 0 * * * *", () => {
      this.resetPerHour()
    }, { name: "ResetLastHourStats" })
  }

  startResetLastDay() {
    cron.schedule("0 0 10 * * *", () => {
      this.resetPerDay()
    }, { name: "ResetLastDayStats" })
  }
}

export default StatsService
