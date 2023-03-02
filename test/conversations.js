import Conversation from "./../app/models/conversation.js";
import ConversationParticipant from "./../app/models/conversation_participant.js";
import User from "./../app/models/user.js";
import assert from "assert";
import { connectToDBPromise } from "./../app/lib/db.js";
import { createUserArray, sendLogin, sendLogout } from "./utils.js";
import { default as PacketProcessor } from "./../app/routes/delivery_manager.js";

let currentUserToken = "";
let usersIds = [];
let filterUpdatedAt = "";
let currentConversationId = "";
let ArrayOfTmpConversaionts = [];
let lastMessageInChat = "";

describe("Conversation functions", async () => {
  before(async () => {
    await connectToDBPromise();
    usersIds = await createUserArray(4);
    currentUserToken = (await sendLogin("test", "user_1")).response.user._id;
  });

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      currentConversationId = responseData.response.conversation._id.toString();

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.conversation, undefined);
      assert.equal(responseData.response.error, undefined);
      await sendLogout("test", currentUserToken);
      currentUserToken = "";
    });

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(responseData.response.conversation, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 404,
        message: "Unauthorized",
      });
    });

    it("should fail because user is not logged in (list of conversation)", async () => {
      const requestData = {
        request: {
          conversation_list: {
            limit: 2,
          },
          id: "5_3",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 404,
        message: "Unauthorized",
      });
    });

    it("should fail because user is not logged in (delete conversation)", async () => {
      const requestData = {
        request: {
          conversation_delete: {
            id: currentConversationId,
          },
          id: "5_4",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 404,
        message: "Unauthorized",
      });
    });

    it("should fail because user doesn't have access (update conversation)", async () => {
      currentUserToken = (await sendLogin("test", "user_2")).response.user
        .token;

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(responseData.response.conversation, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 403,
        message: "Forbidden",
      });
    });

    it("should work remove yourself from the conversation ", async () => {
      const requestData = {
        request: {
          conversation_delete: {
            id: currentConversationId,
          },
          id: "5_6",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notStrictEqual(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, undefined);
    });

    after(async () => {
      const tmpToken = (await sendLogin("login_tmp", "user_1")).response.user
        .token;
      const requestDataDelete = {
        request: {
          conversation_delete: {
            id: currentConversationId,
          },
          id: "00",
        },
      };
      await PacketProcessor.processJsonMessageOrError(
        "login_tmp",
        requestDataDelete
      );
      const requestDataLogout = {
        request: {
          user_logout: {},
          id: "0102",
        },
      };
      await PacketProcessor.processJsonMessageOrError(
        "login_tmp",
        requestDataLogout
      );
    });
  });

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );
      currentConversationId = responseData.response.conversation._id.toString();

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.conversation, undefined);
      assert.equal(responseData.response.error, undefined);
    });

    it("should work create conversation duplicate", async () => {
      const requestData = {
        request: {
          conversation_create: {
            name: "chat123",
            description: "for admin and users",
            type: "u",
            opponent_id: usersIds[2],
            participants: [usersIds[2]],
          },
          id: "1_1",
        },
      };
      let responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );
      const countRecordsFirst = await Conversation.findAll(
        {
          name: "chat123",
        },
        null,
        100
      );
      responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );
      const countRecordsSecond = await Conversation.findAll(
        {
          name: "chat123",
        },
        null,
        100
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.conversation, undefined);
      assert.equal(countRecordsFirst.length, countRecordsSecond.length);
      assert.equal(responseData.response.error, undefined);
    });

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(responseData.response.conversation, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Participants not provided",
      });
    });

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(responseData.response.conversation, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Select at least one user",
      });
    });

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(responseData.response.conversation, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Select at least one user",
      });
    });

    it("should fail because conversation's name missed", async () => {
      const requestData = {
        request: {
          conversation_create: {
            description: "for admin and users",
            participants: [usersIds[0]],
            type: "g",
          },
          id: "1_5",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(responseData.response.conversation, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "No conversation name specified",
      });
    });

    it("should fail because conversation's type missed", async () => {
      const requestData = {
        request: {
          conversation_create: {
            name: "chat5",
            description: "for admin and users",
            participants: [usersIds[0], usersIds[1]],
          },
          id: "1_6",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(responseData.response.conversation, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Conversation Type missed",
      });
    });

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(responseData.response.conversation, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect type",
      });
    });

    it("should fail because conversation's type is 'u', but more than two users are selected", async () => {
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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(responseData.response.conversation, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Too many users in private conversation",
      });
    });
  });

  describe("Update Conversation", async () => {
    it("should fail because conversation not found", async () => {
      await sendLogin("test", "user_2");
      const requestData = {
        request: {
          conversation_update: {
            id: "currentConversationId",
            name: "name2",
            description: "description_tes22",
          },
          id: "2_1",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(responseData.response.conversation, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 400,
        message: "Bad Request",
      });
    });

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.conversation, undefined);
      assert.equal(responseData.response.error, undefined);
    });

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.conversation, undefined);
      assert.equal(responseData.response.error, undefined);
    });

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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.conversation, undefined);
      assert.equal(responseData.response.error, undefined);
    });
  });

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
        };
        let responseData = (
          await PacketProcessor.processJsonMessageOrError("test", requestData)
        ).response.conversation;
        i == 1 ? (filterUpdatedAt = responseData.updated_at) : true;
        ArrayOfTmpConversaionts.push(responseData._id.toString());
      }

      for (let i = 0; i < 3; i++) {
        let requestData = {
          message: {
            id: `messages_${i}`,
            body: `this is messages ${i + 1}`,
            cid: ArrayOfTmpConversaionts[0],
          },
        };
        let responseData = await PacketProcessor.processJsonMessageOrError(
          "test",
          requestData
        );
        lastMessageInChat = responseData.ask.server_mid;
      }
    });

    it("should work check last_message id", async () => {
      const requestData = {
        request: {
          conversation_list: {},
          id: "3_0",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(
        responseData.response.conversations
          .find((el) => el._id.toString() === ArrayOfTmpConversaionts[0])
          ?.last_message._id.toString(),
        lastMessageInChat.toString()
      );
      assert.notEqual(responseData.response.conversations, undefined);
      assert.equal(responseData.response.error, undefined);
    });

    it("should work check count of unread_messages", async () => {
      await sendLogout("test", currentUserToken);
      currentUserToken = (await sendLogin("test", "user_4")).response.user
        .token;
      const requestData = {
        request: {
          conversation_list: {},
          id: "3_0",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(
        responseData.response.conversations[0].unread_messages_count,
        0
      );
      assert.strictEqual(
        responseData.response.conversations[2].unread_messages_count,
        3
      );
      assert.notEqual(responseData.response.conversations, undefined);
      assert.equal(responseData.response.error, undefined);
    });

    it("should work with a time parameter", async () => {
      const numberOf = 2;
      const requestData = {
        request: {
          conversation_list: {
            updated_at: {
              gt: filterUpdatedAt,
            },
          },
          id: "3_1",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );
      const count = responseData.response.conversations.length;

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.conversations, undefined);
      assert(count <= numberOf, "limit filter does not work");
      assert.equal(responseData.response.error, undefined);
    });

    it("should fail limit exceeded", async () => {
      await sendLogout("test", currentUserToken);
      currentUserToken = (await sendLogin("test", "user_1")).response.user
        .token;
      const numberOf = 3;
      const requestData = {
        request: {
          conversation_list: {},
          id: "3_2",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );
      const count = responseData.response.conversations.length;
      assert.notEqual(responseData.response.conversations, undefined);
      assert.notEqual(count, numberOf);
      assert.equal(responseData.response.error, undefined);
    });

    it("should work a time parameter and limit", async () => {
      await sendLogout("test", currentUserToken);
      currentUserToken = (await sendLogin("test", "user_4")).response.user
        .token;
      const numberOf = 1;
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
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );
      const count = responseData.response.conversations.length;
      const checkDate =
        responseData.response.conversations[0].updated_at > filterUpdatedAt;

      assert(checkDate, "date is false");
      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.conversations, undefined);
      assert.strictEqual(count, numberOf);
      assert.equal(responseData.response.error, undefined);
    });

    it("should work with limit", async () => {
      const numberOf = 2;
      const requestData = {
        request: {
          conversation_list: {
            limit: numberOf,
          },
          id: "3_4",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );
      const count = responseData.response.conversations.length;

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.conversations, undefined);
      assert.strictEqual(count, numberOf);
      assert.equal(responseData.response.error, undefined);
    });
  });

  describe("Delete Conversation", async () => {
    before(async () => {
      await sendLogout("test", currentUserToken);
      currentUserToken = (await sendLogin("test", "user_1")).response.user
        .token;
    });

    it("should fail because conversation not found", async () => {
      const requestData = {
        request: {
          conversation_delete: {
            id: "630f1d007ab4ed1a72a78a6a2",
          },
          id: "4_1",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 400,
        message: "Bad Request",
      });
    });

    it("should work", async () => {
      const requestData = {
        request: {
          conversation_delete: {
            id: currentConversationId,
          },
          id: "4_2",
        },
      };
      const responseData = await PacketProcessor.processJsonMessageOrError(
        "test",
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.success, undefined);
      assert.equal(responseData.response.error, undefined);
    });
  });

  after(async () => {
    await User.clearCollection();
    await Conversation.clearCollection();
    await ConversationParticipant.clearCollection();
    usersIds = [];
  });
});
