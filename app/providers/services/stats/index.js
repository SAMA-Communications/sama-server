import process from "node:process"
import prettyMs from "pretty-ms"

export class IncPairDateVal {
  static DATE_TYPES = {
    MIN: 1,
    HOUR: 2,
    DAY: 3
  }

  constructor(dateTypeKey, val = 0) {
    this.dateTypeKey = dateTypeKey ?? IncrementableKeyValue.DATE_TYPES.MIN
    this.val = val
    this.key = this.keyName(new Date())
  }

  inc(inc, date) {
    const checkKey = this.keyName(date)

    if (checkKey === this.key) {
      return this.val += inc
    }

    this.val = inc
    this.key = checkKey

    return this.val
  }

  retrieve(date) {
    if (this.keyName(date) === this.key) {
      return this.val
    }
  }

  reset(date) {
    this.val = 0
    this.key = this.keyName(date)
  }

  keyName(date) {
    switch (this.dateTypeKey) {
      case IncPairDateVal.DATE_TYPES.MIN:
        return `${date.getDate()}:${date.getHours()}:${date.getMinutes()}`
      case IncPairDateVal.DATE_TYPES.HOUR:
        return `${date.getDate()}:${date.getHours()}`
      case IncPairDateVal.DATE_TYPES.DAY:
        return `${date.getDate()}`
    }

    return `${date}`
  }
}

class StatsService {
  messagesPerMinute = new IncPairDateVal(IncPairDateVal.DATE_TYPES.MIN)
  messagesPerHour = new IncPairDateVal(IncPairDateVal.DATE_TYPES.HOUR)
  messagesPerDay = new IncPairDateVal(IncPairDateVal.DATE_TYPES.DAY)

  constructor(config, sessionService) {
    this.config = config
    this.sessionService = sessionService
  }

  incMessagesCount(inc = 1, date = new Date()) {
    inc = this.normalizeInc(inc)

    this.messagesPerMinute.inc(inc, date)
    this.messagesPerHour.inc(inc, date)
    this.messagesPerDay.inc(inc, date)
  }

  normalizeInc(inc) {
    const parsed = parseInt(inc, 10)

    return isNaN(parsed) ? 0 : parsed
  }

  collectServerStats(format, date) {
    const uptime = Math.floor(process.uptime())

    const formattedUptime = format ? prettyMs(uptime * 1000) : uptime

    return {
      uptime: formattedUptime
    }
  }

  collectUsersStats(format, date) {
    return {
      online_users: this.sessionService.totalSessions()
    }
  }

  collectChatStats(format, date) {
    return {
      messages_per_minute: this.messagesPerMinute.retrieve(date) ?? 0,
      messages_per_hour: this.messagesPerHour.retrieve(date) ?? 0,
      messages_per_day: this.messagesPerDay.retrieve(date) ?? 0
    }
  }

  collectStats(format, date = new Date()) {
    const stats = {}

    const serverStats = this.collectServerStats(format, date)
    const usersStats = this.collectUsersStats(format, date)
    const chatStats = this.collectChatStats(format, date)

    return Object.assign(stats, serverStats, usersStats, chatStats)
  }

  resetPerMinute(date) {
    this.messagesPerMinute.reset(date)
  }

  resetPerHour(date) {
    this.messagesPerHour.reset(date)
  }

  resetPerDay(date) {
    this.messagesPerDay.reset(date)
  }

  resetChatStatsAll(date = new Date) {
    this.resetPerMinute(date)
    this.resetPerHour(date)
    this.resetPerDay(date)
  }
}

export default StatsService
