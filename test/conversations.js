import assert from "assert"

import ServiceLocatorContainer from "../app/common/ServiceLocatorContainer.js"

import { createUserArray, mockedWS, sendLogin, sendLogout } from "./utils.js"
import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")
const userTokenRepo = ServiceLocatorContainer.use("UserTokenRepository")
const conversationRepo = ServiceLocatorContainer.use("ConversationRepository")
const conversationParticipantRepo = ServiceLocatorContainer.use("ConversationParticipantRepository")

let currentUserToken = ""
let usersIds = []
let filterUpdatedAt = ""
let currentConversationId = ""
let ArrayOfTmpConversaionts = []
let lastMessageInChat = ""

describe("Conversation functions", async () => {
  before(async () => {
    usersIds = await createUserArray(4)
    currentUserToken = (await sendLogin("test", "user_1")).response.user._id
  })

  describe("IsUserAuth validation", async () => {
    it("should work create conversation", async () => {
      const requestData = {
        request: {
          conversation_create: {
            name: "chat5",
            description: "for admin and users",
            type: "g",
            participants: [usersIds[0], usersIds[1]],
          },
          id: "5_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      currentConversationId = responseData.response.conversation._id.toString()

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.conversation, undefined)
      assert.equal(responseData.response.error, undefined)
      await sendLogout("test", currentUserToken)
      currentUserToken = ""
    })

    it("should fail because user is not logged in (update conversation)", async () => {
      const requestData = {
        request: {
          conversation_update: {
            id: currentConversationId,
            name: "123123",
            description: "asdbzxc1",
            type: "g",
            participants: [usersIds[0]],
          },
          id: "5_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.conversation, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 404,
        message: "Unauthorized.",
      })
    })

    it("should fail because user is not logged in (list of conversation)", async () => {
      const requestData = {
        request: {
          conversation_list: {
            limit: 2,
          },
          id: "5_3",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 404,
        message: "Unauthorized.",
      })
    })

    it("should fail because user is not logged in (delete conversation)", async () => {
      const requestData = {
        request: {
          conversation_delete: {
            id: currentConversationId,
          },
          id: "5_4",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 404,
        message: "Unauthorized.",
      })
    })

    it(`should fail because user doesn't have access (update conversation)`, async () => {
      currentUserToken = (await sendLogin("test", "user_2")).response.user.token

      const requestData = {
        request: {
          conversation_update: {
            id: currentConversationId,
            name: "123123",
            description: "asdbzxc1",
            participants: {},
          },
          id: "5_5",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.conversation, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 403,
        message: "Forbidden.",
      })
    })

    it("should work remove yourself from the conversation ", async () => {
      const requestData = {
        request: {
          conversation_delete: {
            id: currentConversationId,
          },
          id: "5_6",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notStrictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, undefined)
    })

    after(async () => {
      const tmpToken = (await sendLogin("login_tmp", "user_1")).response.user.token

      const requestDataDelete = {
        request: {
          conversation_delete: {
            id: currentConversationId,
          },
          id: "00",
        },
      }

      await packetJsonProcessor.processMessageOrError("login_tmp", JSON.stringify(requestDataDelete))

      const requestDataLogout = {
        request: {
          user_logout: {},
          id: "0102",
        },
      }

      await packetJsonProcessor.processMessageOrError("login_tmp", JSON.stringify(requestDataLogout))
    })
  })

  describe("Create Conversation", async () => {
    it("should work", async () => {
      const requestData = {
        request: {
          conversation_create: {
            name: "chat5",
            description: "for admin and users",
            type: "g",
            participants: [usersIds[0], usersIds[1]],
          },
          id: "1_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      currentConversationId = responseData.response.conversation._id.toString()

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.conversation, undefined)
      assert.equal(responseData.response.error, undefined)
    })

    it("should work create conversation duplicate", async () => {
      const requestData = {
        request: {
          conversation_create: {
            name: "chat123",
            description: "for admin and users",
            type: "u",
            participants: [usersIds[2]],
          },
          id: "1_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      const countRecordsFirst = await conversationRepo.findAll(
        {
          name: "chat123",
        },
        null,
        100
      )
      requestData.request.conversation_create.participants = [usersIds[2]]

      responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      const countRecordsSecond = await conversationRepo.findAll(
        {
          name: "chat123",
        },
        null,
        100
      )

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.conversation, undefined)
      assert.equal(countRecordsFirst.length, countRecordsSecond.length)
      assert.equal(responseData.response.error, undefined)
    })

    it("should fail because only onwer in patisipants", async () => {
      const requestData = {
        request: {
          conversation_create: {
            name: "testing",
            description: "test1",
            type: "g",
            participants: [usersIds[1]],
          },
          id: "1_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.conversation, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Participants not provided.",
      })
    })

    it("should fail because the participant limit has been exceeded", async () => {
      const requestData = {
        request: {
          conversation_create: {
            name: "testing",
            description: "test1",
            type: "g",
            participants: [
              usersIds[1],
              usersIds[2],
              ...["1", "1", "1", "1", "1", "1", "1", "1", "1", "1"],
              ...["1", "1", "1", "1", "1", "1", "1", "1", "1", "1"],
              ...["1", "1", "1", "1", "1", "1", "1", "1", "1", "1"],
              ...["1", "1", "1", "1", "1", "1", "1", "1", "1", "1"],
              ...["1", "1", "1", "1", "1", "1", "1", "1", "1", "1"],
            ],
          },
          id: "1_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.conversation, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "There are too many users in the group conversation.",
      })
    })

    it("should fail because paticipants is empty", async () => {
      const requestData = {
        request: {
          conversation_create: {
            name: "testing",
            description: "for admin and users",
            type: "g",
            participants: [],
          },
          id: "1_3",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.conversation, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Please select at least one user.",
      })
    })

    it("should fail because paticipents missed", async () => {
      const requestData = {
        request: {
          conversation_create: {
            name: "chat1",
            description: "for admin and users",
            type: "g",
          },
          id: "1_4",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.conversation, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Please select at least one user.",
      })
    })

    it(`should fail because conversation's name missed`, async () => {
      const requestData = {
        request: {
          conversation_create: {
            description: "for admin and users",
            participants: [usersIds[0]],
            type: "g",
          },
          id: "1_5",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.conversation, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: `You haven't specified a conversation name.`,
      })
    })

    it(`should fail because conversation's type missed`, async () => {
      const requestData = {
        request: {
          conversation_create: {
            name: "chat5",
            description: "for admin and users",
            participants: [usersIds[0], usersIds[1]],
          },
          id: "1_6",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.conversation, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Conversation type missed.",
      })
    })

    it("should fail because incorrect type of conversation", async () => {
      const requestData = {
        request: {
          conversation_create: {
            name: "chat5",
            description: "for admin and users",
            type: "k",
            participants: [usersIds[0], usersIds[1]],
          },
          id: "1_7",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.conversation, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "The type you entered is incorrect.",
      })
    })

    it(`should fail because conversation's type is 'u', but more than two users are selected`, async () => {
      const requestData = {
        request: {
          conversation_create: {
            name: "chat5",
            description: "for admin and users",
            type: "u",
            participants: [usersIds[0], usersIds[1], usersIds[2], usersIds[3]],
          },
          id: "1_8",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.conversation, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "There are too many users in the private conversation.",
      })
    })
  })

  describe("Update Conversation", async () => {
    it("should fail because Conversation not found.", async () => {
      await sendLogin("test", "user_2")
      const requestData = {
        request: {
          conversation_update: {
            id: "currentConversationId",
            name: "name2",
            description: "description_tes22",
          },
          id: "2_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.conversation, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 400,
        message: "Bad Request.",
      })
    })

    it("should work update only name and description", async () => {
      const requestData = {
        request: {
          conversation_update: {
            id: currentConversationId,
            name: "name2",
            description: "description_tes22",
          },
          id: "2_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.conversation, undefined)
      assert.equal(responseData.response.error, undefined)
    })

    it("should work add new user", async () => {
      const requestData = {
        request: {
          conversation_update: {
            id: currentConversationId,
            description: "test213",
            participants: {
              add: [usersIds[2]],
            },
          },
          id: "2_3",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(-1)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.conversation, undefined)
      assert.equal(responseData.response.error, undefined)
    })

    it("should work remove user", async () => {
      const requestData = {
        request: {
          conversation_update: {
            id: currentConversationId,
            participants: {
              remove: [usersIds[2]],
            },
          },
          id: "2_4",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(-1)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.conversation, undefined)
      assert.equal(responseData.response.error, undefined)
    })
  })

  describe("List of Conversations", async () => {
    before(async () => {
      for (let i = 0; i < 3; i++) {
        let requestData = {
          request: {
            conversation_create: {
              name: `chat_${i + 1}`,
              description: `conversation_${i + 1}`,
              type: "g",
              participants: [usersIds[3]],
            },
            id: "0",
          },
        }
        let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

        responseData = responseData.backMessages.at(0).response.conversation

        i == 1 ? (filterUpdatedAt = responseData.updated_at) : true
        ArrayOfTmpConversaionts.push(responseData._id.toString())
      }

      for (let i = 0; i < 3; i++) {
        let requestData = {
          message: {
            id: `messages_${i}`,
            body: `this is messages ${i + 1}`,
            cid: ArrayOfTmpConversaionts[0],
          },
        }
        let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

        responseData = responseData.backMessages.at(0)

        lastMessageInChat = responseData.ask.server_mid
      }
    })

    it("should work check last_message id", async () => {
      const requestData = {
        request: {
          conversation_list: {},
          id: "3_0",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(
        responseData.response.conversations
          .find((el) => el._id.toString() === ArrayOfTmpConversaionts[0])
          ?.last_message._id.toString(),
        lastMessageInChat.toString()
      )
      assert.notEqual(responseData.response.conversations, undefined)
      assert.equal(responseData.response.error, undefined)
    })

    it("should work check count of unread_messages", async () => {
      await sendLogout("test", currentUserToken)
      currentUserToken = (await sendLogin("test", "user_4")).response.user.token
      const requestData = {
        request: {
          conversation_list: {},
          id: "3_0",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.strictEqual(responseData.response.conversations[0].unread_messages_count, 0)
      assert.strictEqual(responseData.response.conversations[2].unread_messages_count, 3)
      assert.notEqual(responseData.response.conversations, undefined)
      assert.equal(responseData.response.error, undefined)
    })

    it("should work with a time parameter", async () => {
      const numberOf = 2
      const requestData = {
        request: {
          conversation_list: {
            updated_at: {
              gt: filterUpdatedAt,
            },
          },
          id: "3_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      const count = responseData.response.conversations.length

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.conversations, undefined)
      assert(count <= numberOf, "limit filter does not work")
      assert.equal(responseData.response.error, undefined)
    })

    it("should work with ids", async () => {
      const numberOf = 2
      const requestData = {
        request: {
          conversation_list: {
            ids: ArrayOfTmpConversaionts,
          },
          id: "3_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      const conversations = responseData.response.conversations

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.conversations, undefined)
      assert.equal(
        conversations.some((el) => !ArrayOfTmpConversaionts.includes(el._id.toString())),
        false
      )
      assert.equal(responseData.response.error, undefined)
    })

    it("should fail limit exceeded", async () => {
      await sendLogout("test", currentUserToken)
      currentUserToken = (await sendLogin("test", "user_1")).response.user.token
      const numberOf = 3
      const requestData = {
        request: {
          conversation_list: {},
          id: "3_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      const count = responseData.response.conversations.length
      assert.notEqual(responseData.response.conversations, undefined)
      assert.notEqual(count, numberOf)
      assert.equal(responseData.response.error, undefined)
    })

    it("should work a time parameter and limit", async () => {
      await sendLogout("test", currentUserToken)
      currentUserToken = (await sendLogin("test", "user_4")).response.user.token
      const numberOf = 1
      const requestData = {
        request: {
          conversation_list: {
            limit: numberOf,
            updated_at: {
              gt: filterUpdatedAt,
            },
          },
          id: "3_3",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      const count = responseData.response.conversations.length
      const checkDate = responseData.response.conversations[0].updated_at > filterUpdatedAt

      assert(checkDate, "date is false")
      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.conversations, undefined)
      assert.strictEqual(count, numberOf)
      assert.equal(responseData.response.error, undefined)
    })

    it("should work with limit", async () => {
      const numberOf = 2
      const requestData = {
        request: {
          conversation_list: {
            limit: numberOf,
          },
          id: "3_4",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      const count = responseData.response.conversations.length

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.conversations, undefined)
      assert.strictEqual(count, numberOf)
      assert.equal(responseData.response.error, undefined)
    })
  })

  describe("Search for conversations", async () => {
    before(async () => {
      for (let i = 18; i < 24; i++) {
        let requestData = {
          request: {
            conversation_create: {
              name: `chat_${i + 1}`,
              description: `conversation_${i + 1}`,
              type: "g",
              participants: [usersIds[2]],
            },
            id: "0",
          },
        }

        await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))
      }
    })

    it("should work for 1* chats", async () => {
      const requestData = {
        request: {
          conversation_search: {
            name: "chat_1",
          },
          id: "5_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      const conversationsResult = responseData.response.conversations
      const count = conversationsResult.length

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(conversationsResult, undefined)
      assert.equal(count, 2)
    })

    it("should work for 2* chats", async () => {
      const requestData = {
        request: {
          conversation_search: {
            name: "chat_2",
          },
          id: "5_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      const conversationsResult = responseData.response.conversations
      const count = conversationsResult.length

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(conversationsResult, undefined)
      assert.equal(count, 6)
    })

    it("should work for 2* chats with limit", async () => {
      const requestData = {
        request: {
          conversation_search: {
            name: "chat_2",
            limit: 3,
          },
          id: "5_4",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      const conversationsResult = responseData.response.conversations
      const count = conversationsResult.length

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(conversationsResult, undefined)
      assert.equal(count, 3)
    })

    it("should fail name is missing", async () => {
      const requestData = {
        request: {
          conversation_search: {},
          id: "5_3",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.conversation, undefined)
      assert.deepEqual(responseData.response.error, '"name" is required')
    })
  })

  describe("GetParticipantsByCids Conversation", async () => {
    before(async () => {
      await sendLogout("test", currentUserToken)
      currentUserToken = (await sendLogin("test", "user_1")).response.user.token
    })

    it("should fail because cids missed", async () => {
      const requestData = {
        request: {
          get_participants_by_cids: {},
          id: "4_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: `'cids' field is required.`,
      })
    })

    it("should work", async () => {
      const requestData = {
        request: {
          get_participants_by_cids: {
            cids: [currentConversationId],
          },
          id: "4_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.equal(responseData.response.users.length, 2)
      assert.equal(responseData.response.users[0]._id.toString(), usersIds[1].toString())
      assert.equal(responseData.response.users[1]._id.toString(), usersIds[0].toString())
      assert.equal(responseData.response.error, undefined)
    })

    it("should fail, participant is not in the chat", async () => {
      await sendLogout("test", currentUserToken)
      currentUserToken = (await sendLogin("test", "user_3")).response.user.token

      const requestData = {
        request: {
          get_participants_by_cids: {
            cids: [currentConversationId],
          },
          id: "4_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.equal(responseData.response.users.length, 0)

      await sendLogout("test", currentUserToken)
      currentUserToken = (await sendLogin("test", "user_1")).response.user.token
    })
  })

  describe("Delete Conversation", async () => {
    before(async () => {
      await sendLogout("test", currentUserToken)
      currentUserToken = (await sendLogin("test", "user_1")).response.user.token
    })

    it("should fail because Conversation not found.", async () => {
      const requestData = {
        request: {
          conversation_delete: {
            id: "630f1d007ab4ed1a72a78a6a2",
          },
          id: "4_1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 400,
        message: "Bad Request.",
      })
    })

    it("should work", async () => {
      const requestData = {
        request: {
          conversation_delete: {
            id: currentConversationId,
          },
          id: "4_2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError("test", JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.success, undefined)
      assert.equal(responseData.response.error, undefined)
    })
  })

  describe("Re-store conversation 1-1", async () => {
    it("should work create conversation, I deleted, I restored", async () => {
      await sendLogout("test", currentUserToken)
      currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user._id
      let requestData_create = {
        request: {
          conversation_create: {
            type: "u",
            participants: [usersIds[3]],
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData_create))

      responseData = responseData.backMessages.at(0)
      currentConversationId = responseData.response.conversation._id.toString()

      const requestData_delete = {
        request: {
          conversation_delete: {
            id: currentConversationId,
          },
          id: "1",
        },
      }

      responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData_delete))

      responseData = responseData.backMessages.at(0)

      let participantsCount = await conversationParticipantRepo.count({
        conversation_id: currentConversationId,
      })
      assert.equal(participantsCount, 1)

      requestData_create = {
        request: {
          conversation_create: {
            type: "u",
            participants: [usersIds[3]],
          },
          id: "1",
        },
      }

      responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData_create))

      responseData = responseData.backMessages.at(0)
      participantsCount = await conversationParticipantRepo.findAll({
        conversation_id: currentConversationId,
      })

      assert.equal(participantsCount.length, 2)

      assert.strictEqual(requestData_create.request.id, responseData.response.id)
      assert.equal(responseData.response.conversation._id.toString(), currentConversationId)
      assert.notEqual(responseData.response.conversation, undefined)
      assert.equal(responseData.response.error, undefined)
    })

    it("should work create conversation, I deleted, opponent restored", async () => {
      currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user._id
      let participantsCount = await conversationParticipantRepo.count({
        conversation_id: currentConversationId,
      })
      assert.equal(participantsCount, 2)

      let requestData = {
        request: {
          conversation_delete: {
            id: currentConversationId,
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)
      participantsCount = await conversationParticipantRepo.findAll({
        conversation_id: currentConversationId,
      })

      assert.equal(participantsCount.length, 1)

      await sendLogout(mockedWS, currentUserToken)
      currentUserToken = (await sendLogin(mockedWS, "user_4")).response.user._id

      requestData = {
        request: {
          conversation_create: {
            type: "u",
            participants: [usersIds[0]],
          },
          id: "1",
        },
      }

      responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)
      participantsCount = await conversationParticipantRepo.findAll({
        conversation_id: currentConversationId,
      })

      assert.equal(participantsCount.length, 2)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.equal(responseData.response.conversation._id.toString(), currentConversationId)
      assert.notEqual(responseData.response.conversation, undefined)
      assert.equal(responseData.response.error, undefined)
    })
  })

  after(async () => {
    await userRepo.deleteMany({})
    await userTokenRepo.deleteMany({})
    await conversationRepo.deleteMany({})
    await conversationParticipantRepo.deleteMany({})

    usersIds = []
  })
})
