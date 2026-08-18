import process from "node:process"
import moment from "moment"

import { CONSTANTS } from "../../../constants/constants.js"

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

  constructor(config, sessionService, mongoConnection, redisClient) {
    this.config = config
    this.sessionService = sessionService
    this.mongoConnection = mongoConnection
    this.redisClient = redisClient
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

  async collectServerStats(date) {
    const uptime = Math.floor(process.uptime())

    const dependencies = await this.collectHealthStats()

    const isOk = dependencies.every((d) => d.status === "ok")

    return {
      status: isOk ? "ok" : "fail",
      hostname: this.config.get("app.hostName"),
      uptime_seconds: uptime,
      dependencies
    }
  }

  collectUsersStats(date) {
    return {
      online_users: this.sessionService.totalSessions(),
    }
  }

  collectChatStats(date) {
    return {
      messages_per_minute: this.messagesPerMinute.retrieve(date),
      messages_per_hour: this.messagesPerHour.retrieve(date),
      messages_per_day: this.messagesPerDay.retrieve(date),
    }
  }

  async collectHealthStats() {
    const [mongodb, redis] = await Promise.all([this.pingMongo(), this.pingRedis()])

    return [ mongodb, redis ]
  }

  async pingMongo() {
    try {
      await this.withTimeout(this.mongoConnection.command({ ping: 1 }), CONSTANTS.STATS_PING_TIMEOUT_MS)
      return { name: 'mongodb', status: 'ok' }
    } catch (error) {
      return { name: 'mongodb', status: 'fail', error: error.message }
    }
  }

  async pingRedis() {
    try {
      await this.withTimeout(this.redisClient.client.ping(), CONSTANTS.STATS_PING_TIMEOUT_MS)
      return { name: 'redis', status: 'ok' }
    } catch (error) {
      return { name: 'redis', status: 'fail', error: error.message }
    }
  }

  async withTimeout(promise, ms) {
    let timer

    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("ping timeout")), ms)
    })

    try {
      return await Promise.race([promise, timeout])
    } finally {
      clearTimeout(timer)
    }
  }

  async collectStats(date = new Date()) {
    const stats = { hostname: this.config.get("app.hostName") }

    const serverStats = await this.collectServerStats(date)
    const usersStats = this.collectUsersStats(date)
    const chatStats = this.collectChatStats(date)

    return Object.assign(stats, serverStats, usersStats, chatStats)
  }

  resetChatStatsAll(date = new Date()) {
    this.messagesPerMinute.reset(date)
    this.messagesPerHour.reset(date)
    this.messagesPerDay.reset(date)
  }
}

export default StatsService
