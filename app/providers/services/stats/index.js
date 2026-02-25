import process from "node:process"
import prettyMs from "pretty-ms"
import moment from "moment"

export class IncPairDateVal {
  static DATE_TYPES = {
    MIN: "minutes",
    HOUR: "hours",
    DAY: "days",
  }

  static DATE_FORMATS = {
    [IncPairDateVal.DATE_TYPES.MIN]: "YYYY-MM-DD HH:mm",
    [IncPairDateVal.DATE_TYPES.HOUR]: "YYYY-MM-DD HH",
    [IncPairDateVal.DATE_TYPES.DAY]: "YYYY-MM-DD",
  }

  static DATES_DIFF = 2

  dateTypeKey = void 0

  castedValue = null
  castedKey = void 0

  currentValue = 0
  currentKey = void 0

  constructor(dateTypeKey, initValue = 0) {
    this.dateTypeKey = dateTypeKey

    this.currentValue = initValue
    this.currentKey = this.keyName(new Date())
  }

  inc(inc, date) {
    const checkDateKey = this.keyName(date)

    if (checkDateKey !== this.currentKey) {
      this.cast(date)
    }

    this.currentValue += inc

    return this.currentValue
  }

  retrieve(date) {
    const checkDateKey = this.keyName(date)

    if (checkDateKey !== this.currentKey) {
      this.cast(date)
    }

    if (checkDateKey !== this.castedKey) {
      return this.castedValue
    }

    return void 0
  }

  cast(date) {
    if (this.isDateDiffCritical(this.currentKey, date)) {
      this.castedValue = 0
    } else {
      this.castedValue = this.currentValue
    }

    this.castedKey = this.currentKey

    this.currentValue = 0
    this.currentKey = this.keyName(date)
  }

  isDateDiffCritical(dateA, dateB) {
    dateA = moment(dateA, IncPairDateVal.DATE_FORMATS[this.dateTypeKey])
    dateB = moment(dateB)

    const dateDiff = dateA.diff(dateB, this.dateTypeKey)

    return Math.abs(dateDiff) >= IncPairDateVal.DATES_DIFF
  }

  reset(date) {
    this.castedValue = void 0
    this.castedKey = void 0

    this.currentValue = 0
    this.currentKey = this.keyName(date)
  }

  keyName(date) {
    return moment(date).format(IncPairDateVal.DATE_FORMATS[this.dateTypeKey])
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
      uptime: formattedUptime,
    }
  }

  collectUsersStats(format, date) {
    return {
      online_users: this.sessionService.totalSessions(),
    }
  }

  collectChatStats(format, date) {
    return {
      messages_per_minute: this.messagesPerMinute.retrieve(date),
      messages_per_hour: this.messagesPerHour.retrieve(date),
      messages_per_day: this.messagesPerDay.retrieve(date),
    }
  }

  collectStats(format, date = new Date()) {
    const stats = {}

    const serverStats = this.collectServerStats(format, date)
    const usersStats = this.collectUsersStats(format, date)
    const chatStats = this.collectChatStats(format, date)

    return Object.assign(stats, serverStats, usersStats, chatStats)
  }

  resetChatStatsAll(date = new Date()) {
    this.messagesPerMinute.reset(date)
    this.messagesPerHour.reset(date)
    this.messagesPerDay.reset(date)
  }
}

export default StatsService
