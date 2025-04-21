import assert from "assert"

import ServiceLocatorContainer from "../app/common/ServiceLocatorContainer.js"

import { generateNewOrganizationId, createUserArray, mockedWS, sendLogin, sendLogout } from "./tools/utils.js"
import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")
const userTokenRepo = ServiceLocatorContainer.use("UserTokenRepository")
const blockListService = ServiceLocatorContainer.use("BlockListService")

let orgId = void 0
let usersIds = []

describe("UserBlocked functions", async () => {
  before(async () => {
    await userRepo.deleteMany({})
    await userTokenRepo.deleteMany({})

    orgId = await generateNewOrganizationId()
    usersIds = await createUserArray(orgId, 5)

    await sendLogout(mockedWS)
    await sendLogin(mockedWS, orgId, "user_1")
  })

  describe("Block method", async () => {
    it("should work, block user_2", async () => {
      const requestData = {
        request: {
          block_user: {
            ids: [usersIds[1]],
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
            ids: [usersIds[2]],
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
            ids: [usersIds[3]],
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
            ids: [usersIds[4]],
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
            ids: [""],
          },
          id: 6,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.success, true)
    })

    it("should fail, block self user", async () => {
      const requestData = {
        request: {
          block_user: {
            ids: [usersIds.at(0)],
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

  describe("enable/disable", async () => {
    it("should work, disable", async () => {
      const requestData = {
        request: {
          block_list_enable: { enable: false },
          id: 10,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.equal(responseData.response.success, true)

      const blockedUserIds = await blockListService.listMutualBlockedIds(usersIds.at(0))

      assert.equal(blockedUserIds.length, 0)
    })

    it("should work, enable", async () => {
      const requestData = {
        request: {
          block_list_enable: { enable: true },
          id: 11,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.equal(responseData.response.success, true)

      const blockedUserIds = await blockListService.listMutualBlockedIds(usersIds.at(0))

      assert.notEqual(blockedUserIds.length, 0)
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
            ids: [usersIds[1]],
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
            ids: [usersIds[3]],
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
            ids: [""],
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
    await blockListService.blockedUserRepo.deleteMany({})

    usersIds = []
  })
})
