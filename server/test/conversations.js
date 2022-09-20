import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";
import User from "../models/user.js";
import UserSession from "../models/user_session.js";
import assert from "assert";
import { connectToDBPromise } from "../lib/db.js";
import { processJsonMessage } from "../routes/ws.js";

let currentUserToken = "";
let userId = [];
let filterUpdatedAt = "";
let currentConversationId = "";
let ArrayOfTmpConversaionts = [];

async function sendLogin(ws, login) {
  const requestData = {
    request: {
      user_login: {
        login: login,
        password: "user_paswword_1",
      },
      id: "0101",
    },
  };
  const response = await processJsonMessage(ws, requestData);
  return response;
}
async function sendLogout(ws, currentUserToken) {
  const requestData = {
    request: {
      user_logout: {
        token: currentUserToken,
      },
      id: "0102",
    },
  };
  await processJsonMessage("test", requestData);
}

describe("Conversation functions", async () => {
  before(async () => {
    await connectToDBPromise();
    for (let i = 0; i < 4; i++) {
      const requestDataCreate = {
        request: {
          user_create: {
            login: `user_${i + 1}`,
            password: "user_paswword_1",
          },
          id: "0",
        },
      };
      const responseData = await processJsonMessage("test", requestDataCreate);
      userId[i] = JSON.parse(responseData.response.user)._id;
    }
    currentUserToken = (await sendLogin("test", "user_1")).response.user.token;
  });

  describe("IsUserAuth validation", async () => {
    it("should work create conversation", async () => {
      const requestData = {
        request: {
          conversation_create: {
            name: "chat5",
            description: "for admin and users",
            type: "g",
            participants: [userId[0], userId[1]],
          },
          id: "5_1",
        },
      };
      const responseData = await processJsonMessage("test", requestData);
      currentConversationId =
        responseData.response.conversation.params._id.toString();

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
            participants: [userId[0]],
          },
          id: "5_2",
        },
      };
      const responseData = await processJsonMessage("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
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
      const responseData = await processJsonMessage("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
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
      const responseData = await processJsonMessage("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
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
            type: "g",
            participants: [userId[1]],
          },
          id: "5_5",
        },
      };
      const responseData = await processJsonMessage("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
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
      const responseData = await processJsonMessage("test", requestData);

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
      await processJsonMessage("login_tmp", requestDataDelete);
      const requestDataLogout = {
        request: {
          user_logout: {
            token: tmpToken,
          },
          id: "0102",
        },
      };
      await processJsonMessage("login_tmp", requestDataLogout);
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
            participants: [userId[0], userId[1]],
          },
          id: "1_1",
        },
      };
      const responseData = await processJsonMessage("test", requestData);
      currentConversationId =
        responseData.response.conversation.params._id.toString();

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.conversation, undefined);
      assert.equal(responseData.response.error, undefined);
    });

    it("should fail because only onwer in patisipants", async () => {
      const requestData = {
        request: {
          conversation_create: {
            name: "testing",
            description: "test1",
            type: "g",
            participants: [userId[1]],
          },
          id: "1_2",
        },
      };
      const responseData = await processJsonMessage("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.conversation, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Select at least one user",
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
      const responseData = await processJsonMessage("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
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
      const responseData = await processJsonMessage("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
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
            participants: [userId[0]],
            type: "g",
          },
          id: "1_5",
        },
      };
      const responseData = await processJsonMessage("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
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
            participants: [userId[0], userId[1]],
          },
          id: "1_6",
        },
      };
      const responseData = await processJsonMessage("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.conversation, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Incorrect type",
      });
    });

    it("should fail because incorrect type of conversation", async () => {
      const requestData = {
        request: {
          conversation_create: {
            name: "chat5",
            description: "for admin and users",
            type: "k",
            participants: [userId[0], userId[1]],
          },
          id: "1_7",
        },
      };
      const responseData = await processJsonMessage("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
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
            participants: [userId[0], userId[1], userId[2], userId[3]],
          },
          id: "1_8",
        },
      };
      const responseData = await processJsonMessage("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.conversation, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Too many users in private conversation",
      });
    });
  });

  describe("Update Conversation", async () => {
    it("should fail because conversation not found", async () => {
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
      const responseData = await processJsonMessage("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
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
      const responseData = await processJsonMessage("test", requestData);

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
              add: [userId[2]],
            },
          },
          id: "2_3",
        },
      };
      const responseData = await processJsonMessage("test", requestData);

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
              remove: [userId[2]],
            },
          },
          id: "2_4",
        },
      };
      const responseData = await processJsonMessage("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.conversation, undefined);
      assert.equal(responseData.response.error, undefined);
    });
  });

  describe("List of Conversations", async () => {
    before(async () => {
      for (let i = 0; i < 3; i++) {
        const requestData = {
          request: {
            conversation_create: {
              name: `chat_${i + 1}`,
              description: `conversation_${i + 1}`,
              type: "g",
              participants: [userId[3]],
            },
            id: "0",
          },
        };
        const responseData = (await processJsonMessage("test", requestData))
          .response.conversation;
        i == 0 ? (filterUpdatedAt = responseData.params.updated_at) : true;
        ArrayOfTmpConversaionts.push(responseData.params._id.toString());
      }
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
      const responseData = await processJsonMessage("test", requestData);
      const count = responseData.response.conversations.length;

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.conversations, undefined);
      assert(count <= numberOf, "limit filter does not work");
      assert.equal(responseData.response.error, undefined);
    });

    it("should fail limit exceeded", async () => {
      const numberOf = 3;
      const requestData = {
        request: {
          conversation_list: {},
          id: "3_2",
        },
      };
      const responseData = await processJsonMessage("test", requestData);
      const count = responseData.response.conversations.length;

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.conversations, undefined);
      assert.notEqual(count, numberOf);
      assert.equal(responseData.response.error, undefined);
    });

    it("should work a time parameter and limit", async () => {
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
      const responseData = await processJsonMessage("test", requestData);
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
      const responseData = await processJsonMessage("test", requestData);
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
      const responseData = await processJsonMessage("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 404,
        message: "Conversation not found",
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
      const responseData = await processJsonMessage("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.success, undefined);
      assert.equal(responseData.response.error, undefined);
    });
  });

  after(async () => {
    await User.clearCollection();
    await UserSession.clearCollection();
    await Conversation.clearCollection();
    await ConversationParticipant.clearCollection();
    userId = [];
  });
});
