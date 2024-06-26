import assert from "assert"

import ServiceLocatorContainer from "../app/common/ServiceLocatorContainer.js"

import BlockedUser from "./../app/models/blocked_user.js"
import { createUserArray, mockedWS, sendLogin } from "./utils.js"
import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")
const userTokenRepo = ServiceLocatorContainer.use("UserTokenRepository")

let usersIds = []

describe("UserBlocked functions", async () => {
  before(async () => {
    await userRepo.deleteMany({})

    await userTokenRepo.deleteMany({})

    usersIds = await createUserArray(5)
    await sendLogin(mockedWS, "user_1")
  })

  describe("Block method", async () => {
    it("should work, block user_2", async () => {
      const requestData = {
        request: {
          block_user: {
            id: usersIds[1],
          },
          id: 2,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.success, true)
    })

    it("should work, block user_3", async () => {
      const requestData = {
        request: {
          block_user: {
            id: usersIds[2],
          },
          id: 3,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.success, true)
    })

    it("should work, block user_4", async () => {
      const requestData = {
        request: {
          block_user: {
            id: usersIds[3],
          },
          id: 4,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.success, true)
    })

    it("should work, block user_5", async () => {
      const requestData = {
        request: {
          block_user: {
            id: usersIds[4],
          },
          id: 5,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.success, true)
    })

    it("should fail, id missed", async () => {
      const requestData = {
        request: {
          block_user: {
            id: "",
          },
          id: 6,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.success, true)
    })
  })

  describe("List method", async () => {
    it("should work", async () => {
      const requestData = {
        request: {
          list_blocked_users: {},
          id: 2,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.users, undefined)
      assert.equal(responseData.response.users.length, 4)
    })
  })

  describe("Unblock method", async () => {
    it("should work, unblock user_2", async () => {
      const requestData = {
        request: {
          unblock_user: {
            id: usersIds[1],
          },
          id: 2,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.success, true)
    })

    it("should work, unblock user_4", async () => {
      const requestData = {
        request: {
          unblock_user: {
            id: usersIds[3],
          },
          id: 3,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.success, true)
    })

    it("should fail, id missed", async () => {
      const requestData = {
        request: {
          unblock_user: {
            id: "",
          },
          id: 6,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.success, true)
    })

    it("check blocked list again", async () => {
      const requestData = {
        request: {
          list_blocked_users: {},
          id: 2,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.users, undefined)
      assert.equal(responseData.response.users.length, 2)
    })
  })

  after(async () => {
    await userRepo.deleteMany({})
    await BlockedUser.clearCollection()

    usersIds = []
  })
})
