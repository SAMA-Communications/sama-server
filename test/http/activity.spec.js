import assert from "assert"

import ServiceLocatorContainer from "../../app/common/ServiceLocatorContainer.js"

import { createUserArray, sendLogin } from "../tools/utils.js"
import HttpActivityController from "../../APIs/JSON/controllers/http/activity.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")

let usersIds = []

describe("Http Activity", async () => {
  before(async () => {
    await userRepo.deleteMany({})

    usersIds = await createUserArray(3)

    await sendLogin("u1", "user_1")
    await sendLogin("u2", "user_2")
    await sendLogin("u3", "user_3")
  })

  it("online list count", async () => {
    const requestData = { count: true }

    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: requestData,
    }

    const responseData = await HttpActivityController.online_list(res, req)
    const httpResponse = responseData.httpResponse
    const { count } = httpResponse.body

    assert.ok(count >= 3)
  })

  it("online list (idsOnly)", async () => {
    const requestData = { limit: 10, idsOnly: true }

    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: requestData,
    }

    const responseData = await HttpActivityController.online_list(res, req)
    const httpResponse = responseData.httpResponse
    const { users } = httpResponse.body

    assert.ok(users.length <= 10)
  })

  it("online list", async () => {
    const requestData = { limit: 15 }

    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: requestData,
    }

    const responseData = await HttpActivityController.online_list(res, req)
    const httpResponse = responseData.httpResponse
    const { users } = httpResponse.body

    const user = users.at(0)

    assert.ok(users.length <= 15)
    assert.ok(user.login)
  })

  after(async () => {
    await userRepo.deleteMany({})

    usersIds = []
  })
})
