import assert from "assert"

import ServiceLocatorContainer from "../app/common/ServiceLocatorContainer.js"

import { ObjectId } from "@sama/lib/db.js"
import { generateNewOrganizationId, createConversation, createUserArray, mockedWS, sendLogin, sendLogout } from "./tools/utils.js"

import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js"

const userRepo = ServiceLocatorContainer.use("UserRepository")
const conversationRepo = ServiceLocatorContainer.use("ConversationRepository")
const conversationParticipantRepo = ServiceLocatorContainer.use("ConversationParticipantRepository")
const messageRepo = ServiceLocatorContainer.use("MessageRepository")
const messageStatusRepo = ServiceLocatorContainer.use("MessageStatusRepository")
const messageService = ServiceLocatorContainer.use("MessageService")

let orgId = void 0
let filterUpdatedAt = ""
let currentUserToken = ""
let currentConversationId = ""
let usersIds = []
let messagesIds = []
let messageId1 = ""

describe("Message function", async () => {
  before(async () => {
    orgId = await generateNewOrganizationId()
    usersIds = await createUserArray(orgId, 3)

    await sendLogout(mockedWS)
    await sendLogin(mockedWS, orgId, "user_2")
    currentUserToken = (await sendLogin(mockedWS, orgId, "user_1")).response.user._id

    currentConversationId = await createConversation(mockedWS, null, null, "g", [usersIds[1], usersIds[0]])
  })

  describe("Send Message", async () => {
    it("should work", async () => {
      const requestData = {
        message: {
          id: "xyz",
          body: "hey how is going?",
          cid: currentConversationId,
          x: {
            param1: "value",
            param2: "value",
          },
        },
      }
      let responseData = {}
      try {
        responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

        responseData = responseData.backMessages.at(0)
      } catch (error) {
        responseData = {
          response: {
            id: requestData.message.id,
            error: error.cause,
          },
        }
      }

      assert.strictEqual("xyz", responseData.ask.mid)
      assert.notEqual(responseData.ask.t, undefined)
    })

    it("should fail incorrect ID", async () => {
      const requestData = {
        message: {
          id: 12312,
          body: "hey how is going?",
          cid: currentConversationId,
          x: {
            param1: "value",
            param2: "value",
          },
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.ask, undefined)
      assert.deepEqual(responseData.message.error, {
        status: 422,
        message: "Incorrect message ID.",
      })
    })

    it(`should fail 'cid' field is required.`, async () => {
      const requestData = {
        message: {
          id: "xyz",
          body: "hey how is going?",
          x: {
            param1: "value",
            param2: "value",
          },
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.ask, undefined)
      assert.deepEqual(responseData.message.error, {
        status: 422,
        message: `'cid' field is required.`,
      })
    })

    it("should fail participant not found", async () => {
      currentUserToken = (await sendLogin(mockedWS, orgId, "user_3")).response.user.token

      const requestData = {
        message: {
          id: "xyz",
          body: "hey how is going?",
          cid: currentConversationId,
          x: {
            param1: "value",
            param2: "value",
          },
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      await sendLogout(mockedWS, currentUserToken)
      currentUserToken = (await sendLogin(mockedWS, orgId, "user_1")).response.user.token

      assert.equal(responseData.ask, undefined)
      assert.deepEqual(responseData.message.error, {
        status: 403,
        message: "Forbidden.",
      })
    })
  })

  describe("Send System Message", async () => {
    it("should work with cid", async () => {
      const requestData = {
        system_message: {
          id: "xyz",
          x: {
            param1: "value1",
            param2: "value2",
          },
          cid: currentConversationId,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      const deliverMessage = responseData.deliverMessages.at(0)
      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.ask.mid, requestData.system_message.id)
      assert.notEqual(responseData.ask.t, void 0)

      const expectedSystemMessage = {
        _id: requestData.system_message.id,
        t: responseData.ask.t,
        from: usersIds[0],
        cid: currentConversationId,
        x: requestData.system_message.x,
      }

      assert.deepEqual(deliverMessage.packet.system_message, expectedSystemMessage)
      assert.deepEqual(`${deliverMessage.cId}`, `${currentConversationId}`)
      assert.strictEqual(deliverMessage.notSaveInOfflineStorage, true)
    })

    it("should work with uids", async () => {
      const requestData = {
        system_message: {
          id: "xyz",
          x: {
            param1: "value1",
            param2: "value2",
          },
          uids: [usersIds[1], usersIds[2]],
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      const deliverMessage = responseData.deliverMessages.at(0)
      responseData = responseData.backMessages.at(0)

      assert.strictEqual(responseData.ask.mid, requestData.system_message.id)
      assert.notEqual(responseData.ask.t, void 0)

      const expectedSystemMessage = {
        _id: requestData.system_message.id,
        t: responseData.ask.t,
        from: usersIds[0],
        x: requestData.system_message.x,
      }

      assert.deepEqual(deliverMessage.packet.system_message, expectedSystemMessage)
      assert.deepEqual(
        deliverMessage.userIds.map((id) => `${id}`),
        [usersIds[1], usersIds[2]].map((id) => `${id}`)
      )
      assert.strictEqual(deliverMessage.notSaveInOfflineStorage, true)
    })

    it(`should fail 'cid' or 'uids' field is required.`, async () => {
      const requestData = {
        system_message: {
          id: "xyz",
          x: {
            param1: "value",
            param2: "value",
          },
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.ask, undefined)
      assert.deepEqual(responseData.system_message.error, {
        status: 422,
        message: `'cid' or 'uids' field is required.`,
      })
    })

    it(`should fail 'x' is required`, async () => {
      const requestData = {
        system_message: {
          id: "xyz",
          uids: [usersIds[1]],
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.ask, undefined)
      assert.deepEqual(responseData.system_message.error, {
        status: 422,
        message: `'x' field is required.`,
      })
    })

    it(`should fail 'uids' max size 20`, async () => {
      const bigUids = new Array(21).fill(0).map((_, index) => `${usersIds[1]}_${index + 1}`)

      const requestData = {
        system_message: {
          id: "xyz",
          uids: bigUids,
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.ask, undefined)
      assert.deepEqual(responseData.system_message.error, {
        status: 422,
        message: `'uids' max length 20`,
      })
    })

    it(`should fail 'id' is missed`, async () => {
      const requestData = {
        system_message: {
          uids: [usersIds[1]],
          x: { val1: "one" },
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.ask, undefined)
      assert.deepEqual(responseData.system_message.error, {
        status: 422,
        message: `Incorrect message ID.`,
      })
    })
  })

  describe("List of Messages", async () => {
    before(async () => {
      for (let i = 0; i < 8; i++) {
        const requestData = {
          message: {
            id: `messageID_${i + 1}`,
            body: `hey bro, this is message #${i + 1}`,
            cid: currentConversationId,
            x: {
              param1: "value_1",
              param2: "value_2",
            },
          },
        }

        let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

        responseData = responseData.backMessages.at(0)

        if (i === 3) {
          const findMessage = await messageRepo.findById(responseData.ask.server_mid)
          filterUpdatedAt = findMessage.updated_at
        }
      }
    })

    it("should work with limit param", async () => {
      const numberOf = 5
      const requestData = {
        request: {
          message_list: {
            cid: currentConversationId,
            limit: numberOf,
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      const count = responseData.response.messages.length

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.messages, undefined)
      assert.strictEqual(count, numberOf)
      assert.equal(responseData.response.error, undefined)
    })

    it("should work with date param", async () => {
      const numberOf = 4
      const requestData = {
        request: {
          message_list: {
            cid: currentConversationId,
            updated_at: {
              gt: filterUpdatedAt,
            },
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      const count = responseData.response.messages.length

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.messages, undefined)
      assert.strictEqual(count, numberOf)
      assert.equal(responseData.response.error, undefined)
    })

    it("should work with date and limit params", async () => {
      const numberOf = 3
      const requestData = {
        request: {
          message_list: {
            cid: currentConversationId,
            limit: numberOf,
            updated_at: {
              gt: filterUpdatedAt,
            },
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      const count = responseData.response.messages.length

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.messages, undefined)
      assert(count <= numberOf, "limit filter does not work")
      assert.equal(responseData.response.error, undefined)

      for (let i = 0; i < 5; i++) {
        const requestData = {
          request: {
            message_delete: {
              cid: currentConversationId,
              type: "all",
              ids: [`messageID_${i + 1}`],
            },
            id: "00",
          },
        }
        await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      }
    })

    it("should fail user haven`t permission", async () => {
      await sendLogout(mockedWS, currentUserToken)
      currentUserToken = (await sendLogin(mockedWS, orgId, "user_3")).response.user

      const requestData = {
        request: {
          message_list: {
            cid: currentConversationId,
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 403,
        message: "Forbidden.",
      })

      await sendLogout(mockedWS, currentUserToken)
      currentUserToken = (await sendLogin(mockedWS, orgId, "user_1")).response.user
    })

    after(async () => {
      for (let i = 5; i < 10; i++) {
        const requestData = {
          request: {
            message_delete: {
              cid: currentConversationId,
              type: "all",
              ids: [`messageID_${i + 1}`],
            },
            id: "00",
          },
        }
        await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      }
    })
  })

  describe("Delete Message", async () => {
    before(async () => {
      await messageRepo.deleteMany({})

      for (let i = 0; i < 4; i++) {
        const requestData = {
          message: {
            id: `include_${i + 1}`,
            body: "hey how is going?",
            cid: currentConversationId,
            deleted_for: [new ObjectId(usersIds[2])],
          },
        }

        if (i === 3) {
          messageId1 = (await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))).backMessages.at(0).ask
            .server_mid
        } else {
          await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
        }
      }
    })

    it("should work all", async () => {
      const requestData = {
        request: {
          message_delete: {
            cid: currentConversationId,
            ids: ["include_1", "63077ad836b78c3d82af0813"],
            type: "all",
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.success, undefined)
      assert.equal(responseData.response.error, undefined)
    })

    it("should work deleted_for", async () => {
      const requestData = {
        request: {
          message_delete: {
            cid: currentConversationId,
            ids: ["include_2", "include_3"],
            type: "myself",
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.success, undefined)
      assert.equal(responseData.response.error, undefined)
    })

    it("should fail incorrect type", async () => {
      const requestData = {
        request: {
          message_delete: {
            cid: "xyz",
            ids: ["63077ad836b78c3d82af0812", "63077ad836b78c3d82af0813"],
            type: "allasdas",
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "The type you entered is incorrect.",
      })
    })

    it("should fail type missed", async () => {
      const requestData = {
        request: {
          message_delete: {
            cid: currentConversationId,
            ids: ["63077ad836b78c3d82af0812", "63077ad836b78c3d82af0813"],
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Message type missed.",
      })
    })

    it("should fail type is incorrect", async () => {
      const requestData = {
        request: {
          message_delete: {
            cid: currentConversationId,
            type: "asdbads",
            ids: ["63077ad836b78c3d82af0812", "63077ad836b78c3d82af0813"],
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "The type you entered is incorrect.",
      })
    })

    it("should fail incorrect cid", async () => {
      const requestData = {
        request: {
          message_delete: {
            cid: "abs",
            ids: ["63077ad836b78c3d82af0812", "63077ad836b78c3d82af0813"],
            type: "all",
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 404,
        message: "Conversation not found.",
      })
    })

    it("should fail cid not found", async () => {
      const requestData = {
        request: {
          message_delete: {
            cid: "asd",
            ids: ["63077ad836b78c3d82af0812", "63077ad836b78c3d82af0813"],
            type: "all",
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 404,
        message: "Conversation not found.",
      })
    })

    it("should fail Message ID missed.", async () => {
      const requestData = {
        request: {
          message_delete: {
            cid: currentConversationId,
            ids: [],
            type: "all",
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Message ID missed.",
      })
    })
  })

  describe("Edit Message", async () => {
    it("should work", async () => {
      const requestData = {
        request: {
          message_edit: {
            id: messageId1,
            body: "updated message body (UPDATED)",
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.success, undefined)
      assert.equal(responseData.response.error, undefined)
    })

    it("should fail id incorrect", async () => {
      const requestData = {
        request: {
          message_edit: {
            id: "include_123123advdzvzdgsd2",
            body: "updated message body (UPDATED)",
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Message ID not found.",
      })
    })

    it("should fail id not found", async () => {
      const requestData = {
        request: {
          message_edit: {
            body: "updated message body (UPDATED123)",
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Message ID not found.",
      })
    })

    it("should fail message content is empty", async () => {
      const requestData = {
        request: {
          message_edit: {
            id: "include_2",
            body: "",
            attachments: [],
          },
          id: "1",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Either message body or attachments required.",
      })
    })

    it("should fail active_user is not owner message", async () => {
      await sendLogin(mockedWS, orgId, "user_3")
      const requestData = {
        request: {
          message_edit: {
            id: messageId1,
            body: "updated message body (UPDATED123)",
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 403,
        message: "Forbidden.",
      })
    })
  })

  describe("Reactions", async () => {
    const reaction1 = "👍"
    const reaction2 = "🤯"
    const reaction3 = "👩‍💻"
    const reaction4 = "🧲"

    before(async () => {
      await sendLogin(mockedWS, orgId, "user_1")
    })

    it("should fail mid is require (update)", async () => {
      const requestData = {
        request: {
          message_reactions_update: {
            add: reaction3,
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect message ID.",
      })
    })

    it("should fail reaction is require (update)", async () => {
      const requestData = {
        request: {
          message_reactions_update: {
            mid: messageId1,
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, '"value" must contain at least one of [add, remove]')
    })

    it("should fail mid is require (list)", async () => {
      const requestData = {
        request: {
          message_reactions_list: {},
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.equal(responseData.response.success, undefined)
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect message ID.",
      })
    })

    it("should reactions list (0)", async () => {
      const requestData = {
        request: {
          message_reactions_list: {
            mid: messageId1,
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.deepEqual(responseData.response.reactions, {})
      assert.equal(responseData.response.error, undefined)
    })

    it("should add reaction", async () => {
      const requestData = {
        request: {
          message_reactions_update: {
            mid: messageId1,
            add: reaction1,
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.success, undefined)
      assert.equal(responseData.response.error, undefined)
    })

    it("should reactions list (1)", async () => {
      const requestData = {
        request: {
          message_reactions_list: {
            mid: messageId1,
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.deepEqual(responseData.response.reactions, { [reaction1]: [usersIds.at(0)] })
      assert.equal(responseData.response.error, undefined)
    })

    it("should remove not existed reaction", async () => {
      const requestData = {
        request: {
          message_reactions_update: {
            mid: messageId1,
            remove: reaction4,
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      const deliveredMessage = responseData.deliverMessages
      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.success, undefined)
      assert.equal(responseData.response.error, undefined)
      assert.equal(deliveredMessage.length, 0)
    })

    it("should add reaction", async () => {
      const requestData = {
        request: {
          message_reactions_update: {
            mid: messageId1,
            add: reaction2,
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.success, undefined)
      assert.equal(responseData.response.error, undefined)
    })

    it("should reactions list (2)", async () => {
      const requestData = {
        request: {
          message_reactions_list: {
            mid: messageId1,
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.deepEqual(responseData.response.reactions, {
        [reaction1]: [usersIds.at(0)],
        [reaction2]: [usersIds.at(0)],
      })
      assert.equal(responseData.response.error, undefined)
    })

    it("change user", async () => {
      await sendLogin(mockedWS, orgId, "user_2")
    })

    it("should add reaction", async () => {
      const requestData = {
        request: {
          message_reactions_update: {
            mid: messageId1,
            add: reaction2,
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.success, undefined)
      assert.equal(responseData.response.error, undefined)
    })

    it("should reactions list (2)", async () => {
      const requestData = {
        request: {
          message_reactions_list: {
            mid: messageId1,
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.deepEqual(responseData.response.reactions, {
        [reaction1]: [usersIds.at(0)],
        [reaction2]: [usersIds.at(0), usersIds.at(1)],
      })
      assert.equal(responseData.response.error, undefined)
    })

    it("should add/remove", async () => {
      const requestData = {
        request: {
          message_reactions_update: {
            mid: messageId1,
            add: reaction3,
            remove: reaction2,
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))
      const deliveredMessage = responseData.deliverMessages.at(0)

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.success, undefined)
      assert.equal(responseData.response.error, undefined)

      assert.deepEqual(`${deliveredMessage.cId}`, `${currentConversationId}`)
      assert.deepEqual(deliveredMessage.packet.message_reactions_update, {
        mid: messageId1.toString(),
        cid: userRepo.castObjectId(currentConversationId),
        c_type: "g",
        from: usersIds.at(1),
        add: reaction3,
        remove: reaction2,
      })
    })

    it("should add", async () => {
      const requestData = {
        request: {
          message_reactions_update: {
            mid: messageId1,
            add: reaction4,
            remove: reaction2,
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.notEqual(responseData.response.success, undefined)
      assert.equal(responseData.response.error, undefined)
    })

    it("should reactions list (4)", async () => {
      const requestData = {
        request: {
          message_reactions_list: {
            mid: messageId1,
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)
      assert.deepEqual(responseData.response.reactions, {
        [reaction1]: [usersIds.at(0)],
        [reaction2]: [usersIds.at(0)],
        [reaction3]: [usersIds.at(1)],
        [reaction4]: [usersIds.at(1)],
      })
      assert.equal(responseData.response.error, undefined)
    })

    it("should list message with reactions", async () => {
      const requestData = {
        request: {
          message_list: {
            cid: currentConversationId,
          },
          id: "2",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)

      assert.strictEqual(requestData.request.id, responseData.response.id)

      const {
        response: { messages },
      } = responseData

      assert.deepEqual(messages.at(0).reactions, {
        own: [reaction4, reaction3].sort(),
        total: { [reaction1]: 1, [reaction4]: 1, [reaction2]: 1, [reaction3]: 1 },
      })

      assert.deepEqual(messages.at(1).reactions, {})
    })

    after(async () => {
      await userRepo.deleteMany({})
      await messageRepo.deleteMany({})
      await conversationRepo.deleteMany({})
      await conversationParticipantRepo.deleteMany({})

      usersIds = []
    })
  })

  describe("Aggregate functions message", async () => {
    before(async () => {
      for (let i = 0; i < 3; i++) {
        const requestDataCreate = {
          request: {
            user_create: {
              organization_id: orgId,
              login: `user_${i + 1}`,
              email: `email_${i + 1}`,
              phone: `phone_${i + 1}`,
              password: "1um",
              device_id: "device1",
            },
            id: "0",
          },
        }

        let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestDataCreate))

        responseData = responseData.backMessages.at(0)
        usersIds[i] = responseData.response.user._id
      }
      currentUserToken = (await sendLogin(mockedWS, orgId, "user_1")).response.user._id.toString()

      let requestData = {
        request: {
          conversation_create: {
            name: "groupChat",
            description: "test aggregation",
            type: "g",
            participants: [usersIds[0], usersIds[1], usersIds[2]],
          },
          id: "0",
        },
      }

      let responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)
      currentConversationId = responseData.response.conversation._id.toString()

      // create 6 messages by u1
      for (let i = 0; i < 6; i++) {
        requestData = {
          message: {
            id: `messages_${i}`,
            body: `this is messages ${i + 1}`,
            cid: currentConversationId,
          },
        }

        responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

        responseData = responseData.backMessages.at(0)

        messagesIds.push(responseData.ask.server_mid)
      }

      // read 3/6 messages by u2
      currentUserToken = (await sendLogin(mockedWS, orgId, "user_2")).response.user._id

      requestData = {
        request: {
          message_read: {
            cid: currentConversationId,
            ids: [messagesIds[0], messagesIds[1], messagesIds[2]],
          },
          id: "123",
        },
      }

      responseData = await packetJsonProcessor.processMessageOrError(mockedWS, JSON.stringify(requestData))

      responseData = responseData.backMessages.at(0)
    })

    describe("--> getLastReadMessageByUserForCid", () => {
      it("should work for u1", async () => {
        const responseData = await messageStatusRepo.findLastReadMessageByUserForCid([new ObjectId(currentConversationId)], usersIds[0])
        assert.strictEqual(responseData[currentConversationId], undefined)
      })

      it("should work for u2", async () => {
        const responseData = await messageStatusRepo.findLastReadMessageByUserForCid([new ObjectId(currentConversationId)], usersIds[1])

        assert.strictEqual(responseData[currentConversationId]?.toString(), messagesIds[2].toString())
      })

      it("should work for u3", async () => {
        const responseData = await messageStatusRepo.findLastReadMessageByUserForCid([new ObjectId(currentConversationId)], usersIds[2])
        assert.strictEqual(responseData[currentConversationId], undefined)
      })
    })

    describe("--> getCountOfUnredMessagesByCid", () => {
      it("should work for sender user (u1)", async () => {
        const responseData = await messageService.aggregateCountOfUnreadMessagesByCid([new ObjectId(currentConversationId)], {
          native_id: usersIds[0],
        })

        assert.strictEqual(responseData[currentConversationId], undefined)
      })

      it("should work for u2 (read 3/6 messages)", async () => {
        const responseData = await messageService.aggregateCountOfUnreadMessagesByCid([new ObjectId(currentConversationId)], {
          native_id: usersIds[1],
        })

        assert.strictEqual(responseData[currentConversationId], 3)
      })

      it("should work for u3 (read 0/6 messages)", async () => {
        const responseData = await messageService.aggregateCountOfUnreadMessagesByCid([new ObjectId(currentConversationId)], {
          native_id: usersIds[2],
        })

        assert.strictEqual(responseData[currentConversationId], 6)
      })
    })

    describe("--> getReadStatusForMids", () => {
      it("should work for sender user (u1)", async () => {
        const responseData = await messageStatusRepo.findReadStatusForMids(messagesIds)
        let isDone = false
        let midsSuccess = 0
        for (let i = 0; i < 3; i++) {
          if (responseData[messagesIds[i]].length) midsSuccess++
        }
        if (midsSuccess === 3) {
          isDone = true
        }
        assert.strictEqual(isDone, true)
      })
    })

    describe("--> getLastMessageForConversation", () => {
      it("should work", async () => {
        const responseData = await messageService.aggregateLastMessageForConversation([new ObjectId(currentConversationId)])
        assert.strictEqual(responseData[currentConversationId]._id?.toString(), messagesIds[5].toString())
      })
    })
  })

  after(async () => {
    await userRepo.deleteMany({})
    await messageRepo.deleteMany({})
    await messageStatusRepo.deleteMany({})
    await conversationRepo.deleteMany({})
    await conversationParticipantRepo.deleteMany({})

    usersIds = []
  })
})
