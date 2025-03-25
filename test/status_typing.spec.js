import assert from "assert"

import ServiceLocatorContainer from "../app/common/ServiceLocatorContainer.js"

import { createConversation, createUserArray, mockedWS, sendLogin, sendLogout } from "./tools/utils.js"
import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")

let currentConversationId = ""
let currentUserToken = ""
let userId = []

describe(`Sending 'typing' status`, async () => {
  before(async () => {
    userId = await createUserArray(2)

    currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user.token

    currentConversationId = await createConversation(mockedWS, null, null, "g", [userId[1], userId[0]])

    await sendLogout(mockedWS, currentUserToken)
  })

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

    await sendLogin(mockedWS, "user_1")
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

  after(async () => {
    await userRepo.deleteMany({})
  })
})
