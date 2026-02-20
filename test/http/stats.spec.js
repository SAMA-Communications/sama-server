import assert from "node:assert"

import { generateNewOrganizationId, createUserArray, sendLogin, sendLogout } from "../tools/utils.js"

import ServiceLocatorContainer from "../../app/common/ServiceLocatorContainer.js"
import { ACTIVE } from "../../app/store/session.js"
import packetJsonProcessor from "../../APIs/JSON/routes/packet_processor.js"
import HttpStatsController from "../../APIs/JSON/controllers/http/stats.js"

const statsService = ServiceLocatorContainer.use("StatsService")
const redisClient = ServiceLocatorContainer.use("RedisClient")
const userRepo = ServiceLocatorContainer.use("UserRepository")

let orgId = void 0
let lastStats = void 0
let usersIds = []

describe("Http Stats", async () => {
  before(async () => {
    await redisClient.client.flushAll()
    await userRepo.deleteMany({})

    statsService.resetChatStatsAll()
    ACTIVE.SESSIONS.clear()

    orgId = await generateNewOrganizationId()
    usersIds = await createUserArray(orgId, 2)
  })

  it("collect empty stats", async () => {
    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: {},
    }

    const responseData = await HttpStatsController.collect(res, req)
    const httpResponse = responseData.httpResponse
    const stats = httpResponse.body

    assert.ok(stats)
    assert.ok(stats.uptime >= 0)
    assert.ok(stats.online_users === 0)
    assert.ok(stats.messages_per_minute === void 0)
    assert.ok(stats.messages_per_hour === void 0)
    assert.ok(stats.messages_per_day === void 0)

    lastStats = stats
  })

  it("connect user1", async () => {
    await sendLogin("u1", orgId, "user_1")
  })

  it("check stats with online user1", async () => {
    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: {},
    }

    const responseData = await HttpStatsController.collect(res, req)
    const httpResponse = responseData.httpResponse
    const stats = httpResponse.body

    assert.ok(stats)
    assert.ok(stats.uptime >= lastStats.uptime)
    assert.ok(stats.online_users === 1)
    // assert.ok(stats.messages_per_minute === 0)
    // assert.ok(stats.messages_per_hour === 0)
    // assert.ok(stats.messages_per_day === 0)

    lastStats = stats
  })

  it("send system message", async () => {
    const requestData = {
      system_message: {
        id: "xyz",
        x: {
          param1: "value1",
          param2: "value2",
        },
        uids: [usersIds.at(1)],
      },
    }

    await packetJsonProcessor.processMessageOrError("u1", JSON.stringify(requestData))
  })

  it("check stats with online user1 and send message", async () => {
    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: {},
    }

    const responseData = await HttpStatsController.collect(res, req)
    const httpResponse = responseData.httpResponse
    const stats = httpResponse.body

    assert.ok(stats)
    assert.ok(stats.uptime >= lastStats.uptime)
    assert.ok(stats.online_users === 1)
    // assert.ok(stats.messages_per_minute === 1)
    // assert.ok(stats.messages_per_hour === 1)
    // assert.ok(stats.messages_per_day === 1)

    lastStats = stats
  })

  it("connect user2", async () => {
    await sendLogin("u2", orgId, "user_1")
  })

  it("check stats with online user2", async () => {
    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: {},
    }

    const responseData = await HttpStatsController.collect(res, req)
    const httpResponse = responseData.httpResponse
    const stats = httpResponse.body

    assert.ok(stats)
    assert.ok(stats.uptime >= lastStats.uptime)
    assert.ok(stats.online_users === 2)
    // assert.ok(stats.messages_per_minute === 1)
    // assert.ok(stats.messages_per_hour === 1)
    // assert.ok(stats.messages_per_day === 1)

    lastStats = stats
  })

  it("send system message user2", async () => {
    const requestData = {
      system_message: {
        id: "xyz",
        x: {
          param1: "value1",
          param2: "value2",
        },
        uids: [usersIds.at(0)],
      },
    }

    await packetJsonProcessor.processMessageOrError("u2", JSON.stringify(requestData))
  })

  it("check stats with online user2 and send message", async () => {
    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: {},
    }

    const responseData = await HttpStatsController.collect(res, req)
    const httpResponse = responseData.httpResponse
    const stats = httpResponse.body

    assert.ok(stats)
    assert.ok(stats.uptime >= lastStats.uptime)
    assert.ok(stats.online_users === 2)
    // assert.ok(stats.messages_per_minute === 2)
    // assert.ok(stats.messages_per_hour === 2)
    // assert.ok(stats.messages_per_day === 2)

    lastStats = stats
  })

  it("logout user1,user2", async () => {
    await sendLogout("u1")
    await sendLogout("u2")
  })

  it("check stats", async () => {
    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: {},
    }

    const responseData = await HttpStatsController.collect(res, req)
    const httpResponse = responseData.httpResponse
    const stats = httpResponse.body

    assert.ok(stats)
    assert.ok(stats.uptime >= lastStats.uptime)
    assert.ok(stats.online_users === 0)
    // assert.ok(stats.messages_per_minute === 2)
    // assert.ok(stats.messages_per_hour === 2)
    // assert.ok(stats.messages_per_day === 2)

    lastStats = stats
  })

  it("reset and check stats", async () => {
    statsService.resetChatStatsAll()

    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: {},
    }

    const responseData = await HttpStatsController.collect(res, req)
    const httpResponse = responseData.httpResponse
    const stats = httpResponse.body

    assert.ok(stats)
    assert.ok(stats.uptime >= lastStats.uptime)
    assert.ok(stats.online_users === 0)
    assert.ok(stats.messages_per_minute === void 0)
    assert.ok(stats.messages_per_hour === void 0)
    assert.ok(stats.messages_per_day === void 0)
  })

  after(async () => {
    await userRepo.deleteMany({})

    usersIds = []
  })
})
