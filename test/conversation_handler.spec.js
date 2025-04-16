import assert from "assert"

import ServiceLocatorContainer from "../app/common/ServiceLocatorContainer.js"

import { createConversation, createUserArray, mockedWS, sendLogin, sendLogout } from "./utils.js"
import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")
const conversationRepo = ServiceLocatorContainer.use("ConversationRepository")
const conversationParticipantRepo = ServiceLocatorContainer.use("ConversationParticipantRepository")
const conversationHandlerRepo = ServiceLocatorContainer.use("ConversationHandlerRepository")

let currentConversationId = ""
let currentUserToken = ""
let userId = []

describe("Conversation scheme functions", async () => {
  before(async () => {
    userId = await createUserArray(2)
    currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user.token

    currentConversationId = await createConversation(mockedWS, null, null, "g", [userId[1], userId[0]])
  })

  describe("Create -->", async () => {
    it("should work, create conversation scheme", async () => {
      const requestData = {
        request: {
          conversation_handler_create: {
            scheme: "test",
            cid: currentConversationId,
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, true)
      assert.strictEqual(responseData.response.error, undefined)
    })

    it("should work, update conversation scheme", async () => {
      const requestData = {
        request: {
          conversation_handler_create: {
            scheme: "test1",
            cid: currentConversationId,
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, true)
      assert.strictEqual(responseData.response.error, undefined)
    })

    it("should fail, cid field is required", async () => {
      const requestData = {
        request: {
          conversation_handler_create: {
            scheme: "test",
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.strictEqual(responseData.response.error, '"cid" is required')
    })

    it("should fail, scheme field is required", async () => {
      const requestData = {
        request: {
          conversation_handler_create: {
            cid: currentConversationId,
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.strictEqual(responseData.response.error, '"scheme" is required')
    })

    it("should fail, cid is incorrect", async () => {
      const requestData = {
        request: {
          conversation_handler_create: {
            scheme: "test",
            cid: "123",
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, { status: 400, message: "Bad Request." })
    })

    it("should fail, scheme incorrect format", async () => {
      const requestData = {
        request: {
          conversation_handler_create: {
            scheme: {},
            cid: "123",
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.strictEqual(responseData.response.error, '"scheme" must be a string')
    })
  })

  describe("Get -->", async () => {
    it("should work, get conversation scheme", async () => {
      const requestData = {
        request: {
          get_conversation_handler: {
            cid: currentConversationId,
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.conversation_handler.scheme, "test1")
      assert.strictEqual(responseData.response.conversation_handler.updated_by.toString(), userId[0].toString())
      assert.strictEqual(responseData.response.error, undefined)
    })

    it("should fail, incorrect cid", async () => {
      const requestData = {
        request: {
          get_conversation_handler: {
            cid: "currentConversationId",
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.conversation_handler, undefined)
      assert.deepEqual(responseData.response.error, { status: 400, message: "Bad Request." })
    })

    it("should fail, cid field is missed", async () => {
      const requestData = {
        request: {
          get_conversation_handler: {},
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.conversation_handler, undefined)
      assert.strictEqual(responseData.response.error, '"cid" is required')
    })

    it("should fail, scheme not found", async () => {
      await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify({
          request: { conversation_handler_delete: { cid: currentConversationId }, id: "1" },
        })
      )

      const requestData = {
        request: {
          get_conversation_handler: {
            cid: currentConversationId,
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.conversation_handler, undefined)
      assert.deepEqual(responseData.response.error, {
        message: "Scheme for this conversation not found.",
        status: 422,
      })

      await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify({
          request: { conversation_handler_create: { scheme: "test1", cid: currentConversationId }, id: "1" },
        })
      )
    })
  })

  describe("Delete -->", async () => {
    it("should work, delete conversation scheme", async () => {
      const requestData = {
        request: {
          conversation_handler_delete: {
            cid: currentConversationId,
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, true)
      assert.strictEqual(responseData.response.error, undefined)
    })

    it("should fail, no scheme", async () => {
      const requestData = {
        request: {
          get_conversation_handler: {
            cid: currentConversationId,
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        message: "Scheme for this conversation not found.",
        status: 422,
      })
    })

    it("should fail, cid is incorrect", async () => {
      const requestData = {
        request: {
          get_conversation_handler: {
            cid: "asdasdasd",
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        message: "Bad Request.",
        status: 400,
      })
    })

    it("should fail, cid field is missed", async () => {
      const requestData = {
        request: {
          get_conversation_handler: {},
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.conversation_handler, undefined)
      assert.strictEqual(responseData.response.error, '"cid" is required')
    })
  })

  describe("User with no permissions -->", async () => {
    it("should fail, create conversation scheme", async () => {
      await sendLogout(mockedWS, currentUserToken)
      currentUserToken = (await sendLogin(mockedWS, "user_2")).response.user.token

      const requestData = {
        request: {
          conversation_handler_create: {
            scheme: "test3",
            cid: currentConversationId,
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 403,
        message: "Forbidden.",
      })
    })

    it("should fail, get conversation scheme", async () => {
      const requestData = {
        request: {
          get_conversation_handler: {
            cid: currentConversationId,
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 403,
        message: "Forbidden.",
      })
    })

    it("should fail, delete conversation scheme", async () => {
      const requestData = {
        request: {
          conversation_handler_delete: {
            cid: currentConversationId,
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 403,
        message: "Forbidden.",
      })
    })
  })

  after(async () => {
    await userRepo.deleteMany({})
    await conversationRepo.deleteMany({})
    await conversationHandlerRepo.deleteMany({})
    await conversationParticipantRepo.deleteMany({})
  })
})
