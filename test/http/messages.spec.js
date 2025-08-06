import assert from "node:assert"

import ServiceLocatorContainer from "../../app/common/ServiceLocatorContainer.js"

import { generateNewOrganizationId, createUserArray, createConversation, sendLogin, sendLogout, mockedWS } from "../tools/utils.js"
import HttpMessageController from "../../APIs/JSON/controllers/http/message.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")
const userTokenRepo = ServiceLocatorContainer.use("UserTokenRepository")
const conversationRepo = ServiceLocatorContainer.use("ConversationRepository")
const conversationParticipantRepo = ServiceLocatorContainer.use("ConversationParticipantRepository")

let orgId = void 0
let usersIds = []
let conversationId = null
let createdMessageId = null

describe("Http Messages", async () => {
  before(async () => {
    await userRepo.deleteMany({})
    await userTokenRepo.deleteMany({})
    await conversationRepo.deleteMany({})
    await conversationParticipantRepo.deleteMany({})

    orgId = await generateNewOrganizationId()
    usersIds = await createUserArray(orgId, 2)
    await sendLogout(mockedWS)
    await sendLogin(mockedWS, orgId, "user_1")
    conversationId = await createConversation(mockedWS, void 0, void 0, "u", usersIds)
  })

  it("send system", async () => {
    const requestData = {
      organizationId: orgId,
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
    const deliveredMessage = responseData.deliverMessages.at(0)

    assert.equal(httpResponse.body.ask.mid, requestData.messageSystem.id)
    assert.deepEqual(deliveredMessage.userIds, usersIds)
  })

  it("send", async () => {
    const requestData = {
      organizationId: orgId,
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
    assert.deepEqual(deliveredMessages.userIds, usersIds)

    createdMessageId = httpResponse.body.ask.server_mid
  })

  it("edit", async () => {
    const requestData = {
      organizationId: orgId,
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
    assert.deepEqual(deliveredMessages.userIds, usersIds)
  })

  it("update reaction", async () => {
    const reaction1 = "🍪"
    const reaction2 = "🐶"

    const requestData = {
      organizationId: orgId,
      senderId: usersIds.at(0),
      messageReaction: {
        mid: createdMessageId,
        add: reaction1,
        remove: reaction2,
      },
    }

    const req = {}
    const res = {
      fakeWsSessionKey: Symbol("Test http ws fake session"),
      parsedBody: requestData,
    }

    const responseData = await HttpMessageController.reaction(res, req)
    const httpResponse = responseData.httpResponse
    const deliveredMessage = responseData.deliverMessages.at(0)

    assert.deepEqual(httpResponse.body, { success: true })
    assert.deepEqual(deliveredMessage.userIds, usersIds)
    assert.deepEqual(deliveredMessage.packet.message_reactions_update, {
      mid: createdMessageId,
      cid: userRepo.castObjectId(conversationId),
      c_type: "u",
      from: usersIds.at(0),
      add: reaction1,
    })
  })

  it("read", async () => {
    const requestData = {
      organizationId: orgId,
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
      organizationId: orgId,
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
    assert.deepEqual(deliveredMessages.userIds, usersIds)
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
