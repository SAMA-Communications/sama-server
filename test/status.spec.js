import assert from "assert"

import ServiceLocatorContainer from "../app/common/ServiceLocatorContainer.js"

import {
  generateNewOrganizationId,
  createConversation,
  createUserArray,
  mockedWS,
  sendLogin,
  sendLogout,
} from "./tools/utils.js"
import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")

let orgId = void 0
let currentConversationId = ""
let currentUserToken = ""
let userId = []

describe("Status", async () => {
  before(async () => {
    orgId = await generateNewOrganizationId()
    userId = await createUserArray(orgId, 2)

    await sendLogout(mockedWS)
    currentUserToken = (await sendLogin(mockedWS, orgId, "user_1")).response.user.token

    currentConversationId = await createConversation(mockedWS, null, null, "g", [userId[1], userId[0]])

    await sendLogout(mockedWS, orgId, currentUserToken)
  })

  describe("Typing", async () => {
    it("should fail user not login", async () => {
      const requestData = {
        typing: {
          cid: currentConversationId,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.typing.user, undefined)
      assert.deepEqual(responseData.typing.error, {
        status: 401,
        message: "Unauthorized.",
      })

      await sendLogin(mockedWS, orgId, "user_1")
    })

    it("should fail cid or to missed", async () => {
      const requestData = {
        typing: {},
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.typing.user, undefined)
      assert.deepEqual(responseData.typing.error, {
        status: 422,
        message: `'cid' field is required.`,
      })
    })

    it("should fail Conversation not found", async () => {
      const requestData = {
        typing: {
          cid: "currentConversationId",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.typing.user, undefined)
      assert.deepEqual(responseData.typing.error, {
        status: 404,
        message: "Conversation not found.",
      })
    })

    it("should work", async () => {
      const requestData = {
        typing: {
          cid: currentConversationId,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData, undefined)
    })
  })

  describe("Ping", async () => {
    it("should send ping", async () => {
      const requestData = {
        request: {
          ping: {},
          id: "xyz",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.id, requestData.request.id)
      assert.deepEqual(responseData.response.pong, {})
    })
  })

  after(async () => {
    await userRepo.deleteMany({})
  })
})
