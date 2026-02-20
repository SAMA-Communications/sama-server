import assert from "node:assert"
import moment from "moment"

import "../tools/utils.js"

import ServiceLocatorContainer from "../../app/common/ServiceLocatorContainer.js"

const statsService = ServiceLocatorContainer.use("StatsService")
let date = void 0

describe("Unit Stats Service", async () => {
  before(async () => {
    date = moment().date(0).hour(0).minutes(0).seconds(0).milliseconds(0).toDate()
    statsService.resetChatStatsAll(date)
  })

  it("check empty", async () => {
    const stats = statsService.collectStats(false, date)

    assert.ok(stats.messages_per_minute === void 0)
    assert.ok(stats.messages_per_hour === void 0)
    assert.ok(stats.messages_per_day === void 0)
  })

  it("inc one same time", async () => {
    statsService.incMessagesCount(1, date)
  })

  it("check", async () => {
    const stats = statsService.collectStats(false, date)

    assert.ok(stats.messages_per_minute === void 0)
    assert.ok(stats.messages_per_hour === void 0)
    assert.ok(stats.messages_per_day === void 0)
  })

  it("inc with new minute", async () => {
    date = moment(date).add(1, "minute").toDate()

    statsService.incMessagesCount(1, date)
  })

  it("check with new minute", async () => {
    const stats = statsService.collectStats(false, date)

    assert.ok(stats.messages_per_minute === 1)
    assert.ok(stats.messages_per_hour === void 0)
    assert.ok(stats.messages_per_day === void 0)
  })

  it("inc with same minute twice", async () => {
    date = moment(date).add(1, "second").toDate()

    statsService.incMessagesCount(1, date)

    date = moment(date).add(1, "second").toDate()

    statsService.incMessagesCount(1, date)
  })

  it("check with same minute", async () => {
    const stats = statsService.collectStats(false, date)

    assert.ok(stats.messages_per_minute === 1)
    assert.ok(stats.messages_per_hour === void 0)
    assert.ok(stats.messages_per_day === void 0)
  })

  it("check with new minute", async () => {
    date = moment(date).add(1, "minute").toDate()

    const stats = statsService.collectStats(false, date)

    assert.ok(stats.messages_per_minute === 3)
    assert.ok(stats.messages_per_hour === void 0)
    assert.ok(stats.messages_per_day === void 0)
  })

  it("check with new hour", async () => {
    date = moment(date).add(1, "hour").toDate()

    const stats = statsService.collectStats(false, date)

    assert.ok(stats.messages_per_minute === 0)
    assert.ok(stats.messages_per_hour === 4)
    assert.ok(stats.messages_per_day === void 0)
  })

  it("inc with new day twice", async () => {
    date = moment(date).add(1, "day").toDate()

    statsService.incMessagesCount(1, date)

    date = moment(date).add(1, "second").toDate()

    statsService.incMessagesCount(1, date)
  })

  it("ckeck with same day", async () => {
    const stats = statsService.collectStats(false, date)

    assert.ok(stats.messages_per_minute === 0)
    assert.ok(stats.messages_per_hour === 0)
    assert.ok(stats.messages_per_day === 4)
  })

  it("check with same day new minute", async () => {
    date = moment(date).add(1, "minute").toDate()

    const stats = statsService.collectStats(false, date)

    assert.ok(stats.messages_per_minute === 2)
    assert.ok(stats.messages_per_hour === 0)
    assert.ok(stats.messages_per_day === 4)
  })

  it("check with new hour", async () => {
    date = moment(date).add(1, "hour").toDate()

    const stats = statsService.collectStats(false, date)

    assert.ok(stats.messages_per_minute === 0)
    assert.ok(stats.messages_per_hour === 2)
    assert.ok(stats.messages_per_day === 4)
  })

  it("inc with same hour", async () => {
    statsService.incMessagesCount(1, date)
  })

  it("check with same hour", async () => {
    const stats = statsService.collectStats(false, date)

    assert.ok(stats.messages_per_minute === 0)
    assert.ok(stats.messages_per_hour === 2)
    assert.ok(stats.messages_per_day === 4)
  })

  it("check with new hour", async () => {
    date = moment(date).add(1, "hour").toDate()

    const stats = statsService.collectStats(false, date)

    assert.ok(stats.messages_per_minute === 0)
    assert.ok(stats.messages_per_hour === 1)
    assert.ok(stats.messages_per_day === 4)
  })

  after(async () => {
    statsService.resetChatStatsAll()
  })
})
