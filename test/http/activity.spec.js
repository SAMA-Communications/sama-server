import assert from "node:assert"

import ServiceLocatorContainer from "../../app/common/ServiceLocatorContainer.js"

import { generateNewOrganizationId, createUserArray, sendLogin } from "../tools/utils.js"
import HttpActivityController from "../../APIs/JSON/controllers/http/activity.js"

const logger = ServiceLocatorContainer.use("Logger")
const redisClient = ServiceLocatorContainer.use("RedisClient")
const userRepo = ServiceLocatorContainer.use("UserRepository")

let orgId = void 0
let usersIds = []

describe("Http Activity", async () => {
  before(async () => {
    await redisClient.client.flushAll()
    await userRepo.deleteMany({})

    orgId = await generateNewOrganizationId()
    usersIds = await createUserArray(orgId, 3)

    await sendLogin("u1", orgId, "user_1")
    await sendLogin("u2", orgId, "user_2")
    await sendLogin("u3", orgId, "user_3")
  })

  it("online list count", async () => {
    const requestData = { organizationId: orgId, userId: usersIds.at(0), count: true }

    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: requestData,
    }

    const responseData = await HttpActivityController.online_list(res, req)
    const httpResponse = responseData.httpResponse
    const { count } = httpResponse.body

    assert.ok(count === 3)
  })

  it("online list (idsOnly)", async () => {
    const requestData = { organizationId: orgId, userId: usersIds.at(0), limit: 2, idsOnly: true }

    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: requestData,
    }

    const responseData = await HttpActivityController.online_list(res, req)
    const httpResponse = responseData.httpResponse
    const { users } = httpResponse.body

    assert.ok(users.length === 2)
  })

  it("online list", async () => {
    const requestData = { organizationId: orgId, userId: usersIds.at(0), offset: 1, limit: 15 }

    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: requestData,
    }

    const responseData = await HttpActivityController.online_list(res, req)
    const httpResponse = responseData.httpResponse
    const { users } = httpResponse.body

    logger.debug("[Online users] %j", users)

    const user = users.at(0)

    assert.ok(users.length === 2)
    assert.ok(user.login)
  })

  after(async () => {
    await userRepo.deleteMany({})

    usersIds = []
  })
})
