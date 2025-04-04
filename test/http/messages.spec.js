import assert from "assert"

import ServiceLocatorContainer from "../../app/common/ServiceLocatorContainer.js"

import { createUserArray, createConversation, sendLogin, mockedWS } from "../tools/utils.js"
import HttpMessageController from "../../APIs/JSON/controllers/http/message.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")
const userTokenRepo = ServiceLocatorContainer.use("UserTokenRepository")
const conversationRepo = ServiceLocatorContainer.use("ConversationRepository")
const conversationParticipantRepo = ServiceLocatorContainer.use("ConversationParticipantRepository")

let usersIds = []
let conversationId = null
let createdMessageId = null

describe("Http Messages", async () => {
  before(async () => {
    await userRepo.deleteMany({})
    await userTokenRepo.deleteMany({})
    await conversationRepo.deleteMany({})
    await conversationParticipantRepo.deleteMany({})

    usersIds = await createUserArray(2)
    await sendLogin(mockedWS, "user_1")
    conversationId = await createConversation(mockedWS, void 0, void 0, "u", usersIds)
  })

  it("send system", async () => {
    const requestData = {
      senderId: usersIds.at(0),
      messageSystem: {
        id: "xyz",
        cid: conversationId,
        x: {
          new_fiend: "f",
        },
      },
    }

    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: requestData,
    }

    const responseData = await HttpMessageController.system_message(res, req)
    const httpResponse = responseData.httpResponse
    const deliveredMessages = responseData.deliverMessages.at(0)

    assert.equal(httpResponse.body.ask.mid, requestData.messageSystem.id)
    assert.deepEqual(deliveredMessages.userIds.reverse(), usersIds)
  })

  it("send", async () => {
    const requestData = {
      senderId: usersIds.at(0),
      message: {
        id: "xyz",
        body: "New One",
        cid: conversationId,
        x: {
          new_fiend: "f",
        },
      },
    }

    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: requestData,
    }

    const responseData = await HttpMessageController.message(res, req)
    const httpResponse = responseData.httpResponse
    const deliveredMessages = responseData.deliverMessages.at(0)

    assert.notEqual(httpResponse.body.ask.server_mid, undefined)
    assert.deepEqual(deliveredMessages.userIds.reverse(), usersIds)

    createdMessageId = httpResponse.body.ask.server_mid
  })

  it("edit", async () => {
    const requestData = {
      senderId: usersIds.at(0),
      messageEdit: {
        id: createdMessageId,
        body: "New created body",
      },
    }

    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: requestData,
    }

    const responseData = await HttpMessageController.edit(res, req)
    const httpResponse = responseData.httpResponse
    const deliveredMessages = responseData.deliverMessages.at(0)

    assert.deepEqual(httpResponse.body, { success: true })
    assert.deepEqual(deliveredMessages.userIds.reverse(), usersIds)
  })

  it("read", async () => {
    const requestData = {
      senderId: usersIds.at(1),
      messageRead: {
        cid: conversationId,
        ids: [createdMessageId],
      },
    }

    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: requestData,
    }

    const responseData = await HttpMessageController.read(res, req)
    const httpResponse = responseData.httpResponse
    const deliveredMessages = responseData.deliverMessages.at(0)

    assert.deepEqual(httpResponse.body, { success: true })
    assert.deepEqual(deliveredMessages.userIds, [usersIds.at(0).toString()])
  })

  it("delete", async () => {
    const requestData = {
      senderId: usersIds.at(1),
      messageDelete: {
        cid: conversationId,
        ids: [createdMessageId],
        type: "all",
      },
    }

    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: requestData,
    }

    const responseData = await HttpMessageController.delete(res, req)
    const httpResponse = responseData.httpResponse
    const deliveredMessages = responseData.deliverMessages.at(0)

    assert.deepEqual(httpResponse.body, { success: true })
    assert.deepEqual(deliveredMessages.userIds.reverse(), usersIds)
  })

  after(async () => {
    await userRepo.deleteMany({})
    await userTokenRepo.deleteMany({})
    await conversationRepo.deleteMany({})
    await conversationParticipantRepo.deleteMany({})

    usersIds = []
    conversationId = null
  })
})
