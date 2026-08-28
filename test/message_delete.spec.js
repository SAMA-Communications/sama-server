import assert from "node:assert"

import ServiceLocatorContainer from "../app/common/ServiceLocatorContainer.js"

import { generateNewOrganizationId, createConversation, createUserArray, mockedWS, sendLogin, sendLogout } from "./tools/utils.js"

import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")
const conversationRepo = ServiceLocatorContainer.use("ConversationRepository")
const conversationParticipantRepo = ServiceLocatorContainer.use("ConversationParticipantRepository")
const messageRepo = ServiceLocatorContainer.use("MessageRepository")

let orgId = void 0
let usersIds = []

async function sendMessage(cid, body, clientId) {
  const requestData = {
    message: {
      id: clientId || `mid_${Date.now()}_${Math.random()}`,
      body,
      cid,
    },
  }

  const responseData = (await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))).backMessages.at(0)

  return responseData.ask.server_mid
}

async function deleteMessages(cid, ids, type) {
  const requestData = {
    request: {
      message_delete: {
        cid,
        ids,
        type,
      },
      id: "delete",
    },
  }

  return (await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))).backMessages.at(0)
}

async function listMessages(cid) {
  const requestData = {
    request: {
      message_list: {
        cid,
      },
      id: "list",
    },
  }

  return (await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))).backMessages.at(0)
}

async function loginAs(login) {
  await sendLogout(mockedWS)
  await sendLogin(mockedWS, orgId, login)
}

describe("Message delete access control", async () => {
  before(async () => {
    orgId = await generateNewOrganizationId()
    usersIds = await createUserArray(orgId, 3)

    await sendLogout(mockedWS)
    await sendLogin(mockedWS, orgId, "user_1")
  })

  describe("type all - own messages", async () => {
    it("should allow the author to delete own messages for everyone", async () => {
      const cid = await createConversation(mockedWS, "own-delete", null, "g", [usersIds[1], usersIds[0]])
      const messageId = await sendMessage(cid, "alice-own")

      const responseData = await deleteMessages(cid, [messageId], "all")

      assert.strictEqual(responseData.response.id, "delete")
      assert.notEqual(responseData.response.success, undefined)
      assert.equal(responseData.response.error, undefined)
      assert.equal(await messageRepo.findById(messageId), null)
    })
  })

  describe("type all - other member's messages", async () => {
    it("should forbid a group member from deleting another member's messages", async () => {
      const cid = await createConversation(mockedWS, "poc-group", null, "g", [usersIds[1], usersIds[0]])
      const aliceMessageIds = [
        await sendMessage(cid, "alice-secret-0"),
        await sendMessage(cid, "alice-secret-1"),
        await sendMessage(cid, "alice-secret-2"),
      ]

      await loginAs("user_2")
      const responseData = await deleteMessages(cid, aliceMessageIds, "all")

      assert.equal(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 403,
        message: "Forbidden.",
      })

      for (const messageId of aliceMessageIds) {
        assert.notEqual(await messageRepo.findById(messageId), null)
      }

      await loginAs("user_1")
      const listed = await listMessages(cid)
      assert.equal(listed.response.messages.length, 3)
    })

    it("should allow a group owner to delete a member's message", async () => {
      const cid = await createConversation(mockedWS, "owner-moderate", null, "g", [usersIds[1], usersIds[0]])

      await loginAs("user_2")
      const bobMessageId = await sendMessage(cid, "bob-message")

      await loginAs("user_1")
      const responseData = await deleteMessages(cid, [bobMessageId], "all")

      assert.notEqual(responseData.response.success, undefined)
      assert.equal(responseData.response.error, undefined)
      assert.equal(await messageRepo.findById(bobMessageId), null)
    })

    it("should forbid deleting an opponent's message for everyone in a private chat", async () => {
      const cid = await createConversation(mockedWS, null, null, "u", [usersIds[1], usersIds[0]])
      const aliceMessageId = await sendMessage(cid, "private-alice")

      await loginAs("user_2")
      const responseData = await deleteMessages(cid, [aliceMessageId], "all")

      assert.equal(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 403,
        message: "Forbidden.",
      })
      assert.notEqual(await messageRepo.findById(aliceMessageId), null)

      await loginAs("user_1")
    })
  })

  describe("type all - other conversation", async () => {
    it("should not delete a message from a conversation the caller is not a member of", async () => {
      const bobCid = await createConversation(mockedWS, "bob-chat", null, "g", [usersIds[1], usersIds[0]])

      await loginAs("user_1")
      const privateCid = await createConversation(mockedWS, "private", null, "g", [usersIds[2], usersIds[0]])

      await loginAs("user_3")
      const carolMessageId = await sendMessage(privateCid, "carol-private")

      await loginAs("user_2")
      const readResponse = await listMessages(privateCid)
      assert.deepEqual(readResponse.response.error, {
        status: 403,
        message: "Forbidden.",
      })

      const deleteResponse = await deleteMessages(bobCid, [carolMessageId], "all")
      assert.equal(deleteResponse.response.success, undefined)
      assert.deepEqual(deleteResponse.response.error, {
        status: 403,
        message: "Forbidden.",
      })
      assert.notEqual(await messageRepo.findById(carolMessageId), null)

      await loginAs("user_3")
      const listed = await listMessages(privateCid)
      assert.equal(listed.response.messages.length, 1)
      assert.equal(listed.response.messages.at(0)._id.toString(), carolMessageId.toString())

      await loginAs("user_1")
    })
  })

  describe("type myself", async () => {
    it("should allow hiding another member's message from own view only", async () => {
      const cid = await createConversation(mockedWS, "myself-delete", null, "g", [usersIds[1], usersIds[0]])
      const aliceMessageId = await sendMessage(cid, "visible-to-bob")

      await loginAs("user_2")
      const responseData = await deleteMessages(cid, [aliceMessageId], "myself")

      assert.notEqual(responseData.response.success, undefined)
      assert.equal(responseData.response.error, undefined)

      const listedByBob = await listMessages(cid)
      assert.equal(listedByBob.response.messages.length, 0)

      const storedMessage = await messageRepo.findById(aliceMessageId)
      assert.notEqual(storedMessage, null)
      assert.ok(storedMessage.deleted_for.map((id) => id.toString()).includes(usersIds[1].toString()))

      await loginAs("user_1")
      const listedByAlice = await listMessages(cid)
      assert.equal(listedByAlice.response.messages.length, 1)
    })

    it("should not mark a message from another conversation as deleted for the caller", async () => {
      const bobCid = await createConversation(mockedWS, "bob-myself", null, "g", [usersIds[1], usersIds[0]])

      await loginAs("user_1")
      const privateCid = await createConversation(mockedWS, "private-myself", null, "g", [usersIds[2], usersIds[0]])

      await loginAs("user_3")
      const carolMessageId = await sendMessage(privateCid, "carol-myself")

      await loginAs("user_2")
      const deleteResponse = await deleteMessages(bobCid, [carolMessageId], "myself")
      assert.equal(deleteResponse.response.success, undefined)
      assert.deepEqual(deleteResponse.response.error, {
        status: 403,
        message: "Forbidden.",
      })

      const storedMessage = await messageRepo.findById(carolMessageId)
      assert.notEqual(storedMessage, null)
      assert.equal((storedMessage.deleted_for || []).length, 0)

      await loginAs("user_1")
    })
  })

  after(async () => {
    await userRepo.deleteMany({})
    await messageRepo.deleteMany({})
    await conversationRepo.deleteMany({})
    await conversationParticipantRepo.deleteMany({})

    usersIds = []
  })
})
