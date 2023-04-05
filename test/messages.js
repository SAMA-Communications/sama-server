import Conversation from "./../app/models/conversation.js";
import ConversationParticipant from "./../app/models/conversation_participant.js";
import MessageStatus from "./../app/models/message_status.js";
import Message from "./../app/models/message.js";
import User from "./../app/models/user.js";
import assert from "assert";
import { ObjectId } from "mongodb";
import { connectToDBPromise } from "../app/lib/db.js";
import {
  createConversation,
  createUserArray,
  mockedWS,
  sendLogin,
  sendLogout,
} from "./utils.js";
import { default as PacketProcessor } from "./../app/routes/packet_processor.js";

let filterUpdatedAt = "";
let currentUserToken = "";
let currentConversationId = "";
let usersIds = [];
let messagesIds = [];
let messageId1 = "";

describe("Message function", async () => {
  before(async () => {
    await connectToDBPromise();
    usersIds = await createUserArray(3);

    await sendLogin(mockedWS, "user_2");
    currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user._id;

    currentConversationId = await createConversation(
      mockedWS,
      null,
      null,
      "g",
      [usersIds[1], usersIds[0]]
    );
  });

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
      };
      let responseData = {};
      try {
        responseData = await PacketProcessor.processJsonMessageOrError(
          mockedWS,
          requestData
        );
      } catch (error) {
        responseData = {
          response: {
            id: requestData.message.id,
            error: error.cause,
          },
        };
      }

      assert.strictEqual(requestData.message.id, responseData.ask.mid);
      assert.notEqual(responseData.ask.t, undefined);
    });

    it("should fail ID not found", async () => {
      const requestData = {
        message: {
          body: "hey how is going?",
          cid: currentConversationId,
          x: {
            param1: "value",
            param2: "value",
          },
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.equal(responseData.ask, undefined);
      assert.deepEqual(responseData.message.error, {
        status: 422,
        message: "Message ID missed",
      });
    });

    it("should fail 'cid' field is required", async () => {
      const requestData = {
        message: {
          id: "xyz",
          body: "hey how is going?",
          x: {
            param1: "value",
            param2: "value",
          },
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.equal(responseData.ask, undefined);
      assert.deepEqual(responseData.message.error, {
        status: 422,
        message: "'cid' field is required",
      });
    });

    it("should fail participant not found", async () => {
      currentUserToken = (await sendLogin(mockedWS, "user_3")).response.user
        .token;
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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );
      await sendLogout(mockedWS, currentUserToken);
      currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user
        .token;

      assert.equal(responseData.ask, undefined);
      assert.deepEqual(responseData.message.error, {
        status: 403,
        message: "Forbidden",
      });
    });
  });

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
        };
        const responseData = await PacketProcessor.processJsonMessageOrError(
          mockedWS,
          requestData
        );

        if (i == 3) {
          const findMessage = await Message.findOne({
            _id: responseData.ask.server_mid,
          });
          filterUpdatedAt = findMessage.updated_at;
        }
      }
    });

    it("should work with limit parametr", async () => {
      const numberOf = 5;
      const requestData = {
        request: {
          message_list: {
            cid: currentConversationId,
            limit: numberOf,
          },
          id: "2",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );
      const count = responseData.response.messages.length;

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.messages, undefined);
      assert.strictEqual(count, numberOf);
      assert.equal(responseData.response.error, undefined);
    });

    it("should work with date parametr", async () => {
      const numberOf = 9;
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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );
      const count = responseData.response.messages.length;

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.messages, undefined);
      assert.strictEqual(count, numberOf);
      assert.equal(responseData.response.error, undefined);
    });

    it("should work with date and limit parametrs", async () => {
      const numberOf = 3;
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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );
      const count = responseData.response.messages.length;

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.messages, undefined);
      assert(count <= numberOf, "limit filter does not work");
      assert.equal(responseData.response.error, undefined);

      for (let i = 0; i < 5; i++) {
        const requestData = {
          request: {
            message_delete: {
              cid: currentConversationId,
              type: "all",
              ids: [`messageID_${i + 1}`],
              from: usersIds[0],
            },
            id: "00",
          },
        };
        await PacketProcessor.processJsonMessageOrError(mockedWS, requestData);
      }
    });

    after(async () => {
      for (let i = 5; i < 10; i++) {
        const requestData = {
          request: {
            message_delete: {
              cid: currentConversationId,
              type: "all",
              ids: [`messageID_${i + 1}`],
              from: usersIds[0],
            },
            id: "00",
          },
        };
        await PacketProcessor.processJsonMessageOrError(mockedWS, requestData);
      }
    });
  });

  describe("Delete Message", async () => {
    before(async () => {
      await Message.clearCollection();
      for (let i = 0; i < 4; i++) {
        const requestData = {
          message: {
            id: `include_${i + 1}`,
            body: "hey how is going?",
            cid: currentConversationId,
            deleted_for: [ObjectId(usersIds[2])],
          },
        };
        i === 3
          ? (messageId1 = (
              await PacketProcessor.processJsonMessageOrError(
                mockedWS,
                requestData
              )
            ).ask.server_mid)
          : await PacketProcessor.processJsonMessageOrError(
              mockedWS,
              requestData
            );
      }
    });

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.success, undefined);
      assert.equal(responseData.response.error, undefined);
    });

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.success, undefined);
      assert.equal(responseData.response.error, undefined);
    });

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.equal(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect type",
      });
    });

    it("should fail type missed", async () => {
      const requestData = {
        request: {
          message_delete: {
            cid: currentConversationId,
            ids: ["63077ad836b78c3d82af0812", "63077ad836b78c3d82af0813"],
          },
          id: "1",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.equal(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Message Type missed",
      });
    });

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.equal(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect type",
      });
    });

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.equal(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 404,
        message: "Conversation not found",
      });
    });

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.equal(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 404,
        message: "Conversation not found",
      });
    });

    it("should fail message id missed", async () => {
      const requestData = {
        request: {
          message_delete: {
            cid: currentConversationId,
            ids: [],
            type: "all",
          },
          id: "1",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.equal(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Message ID missed",
      });
    });
  });

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.success, undefined);
      assert.equal(responseData.response.error, undefined);
    });

    it("should fail id incorrect", async () => {
      const requestData = {
        request: {
          message_edit: {
            id: "include_123123advdzvzdgsd2",
            body: "updated message body (UPDATED)",
          },
          id: "1",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.equal(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Message ID not found",
      });
    });

    it("should fail id not found", async () => {
      const requestData = {
        request: {
          message_edit: {
            body: "updated message body (UPDATED123)",
          },
          id: "2",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.equal(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Message ID missed",
      });
    });

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.equal(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Either message body or attachments required",
      });
    });

    it("should fail active_user is not owner message", async () => {
      await sendLogin(mockedWS, "user_3");
      const requestData = {
        request: {
          message_edit: {
            id: messageId1,
            body: "updated message body (UPDATED123)",
          },
          id: "2",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.equal(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 403,
        message: "Forbidden",
      });
    });

    after(async () => {
      await User.clearCollection();
      await Message.clearCollection();
      await Conversation.clearCollection();
      await ConversationParticipant.clearCollection();
      usersIds = [];
    });
  });

  describe("Aggregate functions message", async () => {
    before(async () => {
      for (let i = 0; i < 3; i++) {
        const requestDataCreate = {
          request: {
            user_create: {
              login: `user_${i + 1}`,
              email: `email_${i + 1}`,
              phone: `phone_${i + 1}`,
              password: "1um",
              deviceId: "device1",
            },
            id: "0",
          },
        };
        const responseData = await PacketProcessor.processJsonMessageOrError(
          mockedWS,
          requestDataCreate
        );
        usersIds[i] = responseData.response.user._id;
      }
      currentUserToken = (
        await sendLogin(mockedWS, "user_1")
      ).response.user._id.toString();

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
      };
      let responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );
      currentConversationId = responseData.response.conversation._id.toString();

      //create 3 messages
      for (let i = 0; i < 6; i++) {
        requestData = {
          message: {
            id: `messages_${i}`,
            body: `this is messages ${i + 1}`,
            cid: currentConversationId,
          },
        };
        responseData = await PacketProcessor.processJsonMessageOrError(
          mockedWS,
          requestData
        );
        messagesIds.push(responseData.ask.server_mid);
      }

      //red 3/6 messages by u2
      currentUserToken = (await sendLogin(mockedWS, "user_2")).response.user
        ._id;
      requestData = {
        request: {
          message_read: {
            cid: currentConversationId,
            ids: [messagesIds[0], messagesIds[1], messagesIds[2]],
          },
          id: "123",
        },
      };
      responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );
    });

    describe("--> getLastReadMessageByUserForCid", () => {
      it("should work for u1", async () => {
        const responseData = await MessageStatus.getLastReadMessageByUserForCid(
          [ObjectId(currentConversationId)],
          usersIds[0]
        );
        assert.strictEqual(responseData[currentConversationId], undefined);
      });

      it("should work for u2", async () => {
        const responseData = await MessageStatus.getLastReadMessageByUserForCid(
          [ObjectId(currentConversationId)],
          usersIds[1]
        );
        assert.strictEqual(
          responseData[currentConversationId]?.toString(),
          messagesIds[2].toString()
        );
      });

      it("should work for u3", async () => {
        const responseData = await MessageStatus.getLastReadMessageByUserForCid(
          [ObjectId(currentConversationId)],
          usersIds[2]
        );
        assert.strictEqual(responseData[currentConversationId], undefined);
      });
    });

    describe("--> getCountOfUnredMessagesByCid", () => {
      it("should work for sender user (u1)", async () => {
        const responseData = await Message.getCountOfUnredMessagesByCid(
          [ObjectId(currentConversationId)],
          usersIds[0]
        );
        assert.strictEqual(responseData[currentConversationId], undefined);
      });

      it("should work for u2 (read 3/6 messages)", async () => {
        const responseData = await Message.getCountOfUnredMessagesByCid(
          [ObjectId(currentConversationId)],
          usersIds[1]
        );
        assert.strictEqual(responseData[currentConversationId], 3);
      });

      it("should work for u3 (read 0/6 messages)", async () => {
        const responseData = await Message.getCountOfUnredMessagesByCid(
          [ObjectId(currentConversationId)],
          usersIds[2]
        );
        assert.strictEqual(responseData[currentConversationId], 6);
      });
    });

    describe("--> getReadStatusForMids", () => {
      it("should work for sender user (u1)", async () => {
        const responseData = await MessageStatus.getReadStatusForMids(
          messagesIds
        );
        let isDone = false;
        let midsSucces = 0;
        for (let i = 0; i < 3; i++) {
          if (responseData[messagesIds[i]].length) midsSucces++;
        }
        if (midsSucces === 3) {
          isDone = true;
        }
        assert.strictEqual(isDone, true);
      });
    });

    describe("--> getLastMessageForConversation", () => {
      it("should work", async () => {
        const responseData = await Message.getLastMessageForConversation([
          ObjectId(currentConversationId),
        ]);
        assert.strictEqual(
          responseData[currentConversationId]._id?.toString(),
          messagesIds[5].toString()
        );
      });
    });
  });

  after(async () => {
    await User.clearCollection();
    await Message.clearCollection();
    await MessageStatus.clearCollection();
    await Conversation.clearCollection();
    await ConversationParticipant.clearCollection();
    usersIds = [];
  });
});
