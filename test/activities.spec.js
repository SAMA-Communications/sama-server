import assert from "assert"

import ServiceLocatorContainer from "../app/common/ServiceLocatorContainer.js"
import { ACTIVITY } from "../app/store/activity.js"
import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js"
import { createUserArray, sendLogin, sendLogout } from "./tools/utils.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")
const activityManagerService = ServiceLocatorContainer.use("ActivityManagerService")

let currentUserToken1 = ""
let currentUserToken = ""
let usersIds = []

describe("User activities", async () => {
  before(async () => {
    usersIds = await createUserArray(3)
    currentUserToken1 = (await sendLogin("line_2", "user_3")).response.user.token
    currentUserToken = (await sendLogin("line_1", "user_1")).response.user.token
  })

  it("should work online list invalid limit", async () => {
    const requestData = {
      request: {
        online_list: { limit: 150 },
        id: "1_list",
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError("line_2", JSON.stringify(requestData))
    responseData = responseData.backMessages.at(0)

    assert.strictEqual(responseData.response.id, requestData.request.id)
    assert.ok(responseData.response.error)
  })

  it("should work online list count", async () => {
    const requestData = {
      request: {
        online_list: { count: true },
        id: "2_list",
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError("line_2", JSON.stringify(requestData))
    responseData = responseData.backMessages.at(0)

    assert.strictEqual(responseData.response.id, requestData.request.id)
    assert.ok(responseData.response.count >= 2)
  })

  it("should work online list idsOnly", async () => {
    const requestData = {
      request: {
        online_list: { idsOnly: true },
        id: "3_list",
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError("line_2", JSON.stringify(requestData))
    responseData = responseData.backMessages.at(0)

    assert.strictEqual(responseData.response.id, requestData.request.id)
    assert.ok(responseData.response.users.length >= 2)
  })

  it("should work online list", async () => {
    const requestData = {
      request: {
        online_list: { limit: 10 },
        id: "4_list",
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError("line_2", JSON.stringify(requestData))
    responseData = responseData.backMessages.at(0)

    console.log(responseData.response.users)

    assert.strictEqual(responseData.response.id, requestData.request.id)
    assert.ok(responseData.response.users.length <= 10)
  })

  it("should work subscribe", async () => {
    const requestData = {
      request: {
        user_last_activity_subscribe: {
          id: usersIds[1],
        },
        id: "1",
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError("line_1", JSON.stringify(requestData))

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(responseData.response.id, requestData.request.id)
    assert.equal(activityManagerService.subscribeTarget(usersIds[0]), usersIds[1])
    assert.notEqual(activityManagerService.subscribers(usersIds[1])[usersIds[0]], undefined)
    assert.notEqual(responseData.response.last_activity, undefined)
  })

  it("should fail User ID missed.", async () => {
    const requestData = {
      request: {
        user_last_activity_subscribe: {},
        id: "1",
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError("line_1", JSON.stringify(requestData))

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(responseData.response.id, requestData.request.id)
    assert.deepEqual(responseData.response.error, {
      status: 422,
      message: "User ID missed.",
    })
  })

  it("should work unsubscribe #1", async () => {
    let requestData = {
      request: {
        user_last_activity_subscribe: {
          id: usersIds[1],
        },
        id: "1",
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError("line_2", JSON.stringify(requestData))

    responseData = responseData.backMessages.at(0)

    requestData = {
      request: {
        user_last_activity_unsubscribe: {},
        id: "1",
      },
    }

    responseData = await packetJsonProcessor.processMessageOrError("line_1", JSON.stringify(requestData))

    responseData = responseData.backMessages.at(0)

    await sendLogout("line_1", currentUserToken)

    assert.strictEqual(responseData.response.id, requestData.request.id)
    assert.strictEqual(responseData.response.success, true)
    assert.equal(ACTIVITY.SUBSCRIBED_TO[usersIds[0]], undefined)
    assert.notEqual(ACTIVITY.SUBSCRIBERS[usersIds[1]], undefined)
    assert.equal(ACTIVITY.SUBSCRIBERS[usersIds[1]][usersIds[0]], undefined)
  })

  it("should work getUserStatus", async () => {
    const requestData = {
      request: {
        user_last_activity: {
          ids: [usersIds[2], usersIds[0]],
        },
        id: "1",
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError("line_2", JSON.stringify(requestData))

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(responseData.response.id, requestData.request.id)
    assert.notEqual(responseData.response.last_activity, undefined)
    assert.equal(responseData.response.last_activity[usersIds[2]], "online")
  })

  it("should work unsubscribe #2", async () => {
    const requestData = {
      request: {
        user_last_activity_unsubscribe: {},
        id: "1",
      },
    }

    let responseData = await packetJsonProcessor.processMessageOrError("line_2", JSON.stringify(requestData))

    responseData = responseData.backMessages.at(0)

    assert.strictEqual(responseData.response.id, requestData.request.id)
    assert.strictEqual(responseData.response.success, true)
    assert.equal(ACTIVITY.SUBSCRIBED_TO[usersIds[2]], undefined)
    assert.deepEqual(ACTIVITY.SUBSCRIBERS[usersIds[1]], {})

    await sendLogout("line_2", currentUserToken1)
  })

  after(async () => {
    await userRepo.deleteMany({})
  })
})
