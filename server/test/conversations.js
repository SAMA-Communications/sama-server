import { processJsonMessage } from "../routes/ws.js";
import { connectToDBPromise } from "../lib/db.js";
import assert from "assert";

let currentUserToken = "";
let userId = [];
let filterUpdateAt = "";
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
async function sendLogut(ws, currentUserToken) {
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

      await sendLogut("test", currentUserToken);
      currentUserToken = "";
    });

    it("should fail because user is not logged in (update conversation)", async () => {
      const requestData = {
        request: {
          conversation_update: {
            id: currentConversationId,
            name: "123123",
            description: "asdbzxc1",
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

    it("should fail because paticipents is missed", async () => {
      const requestData = {
        request: {
          conversation_create: {
            name: "chat1",
            description: "for admin and users",
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

    it("should fail because conversation's name is missed", async () => {
      const requestData = {
        request: {
          conversation_create: {
            description: "for admin and users",
            participants: [userId[0]],
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
              participants: [userId[3]],
            },
            id: "0",
          },
        };
        const responseData = (await processJsonMessage("test", requestData))
          .response.conversation;
        i == 0 ? (filterUpdateAt = responseData.params.updated_at) : true;
        ArrayOfTmpConversaionts.push(responseData.params._id.toString());
      }
    });

    it("should work with a time parameter", async () => {
      //sometimes it doesn't work because several chats can be created at the same time, so the number of chats may differ from the expected
      const numberOf = 2;
      const requestData = {
        request: {
          conversation_list: {
            updated_at: {
              gt: filterUpdateAt,
            },
          },
          id: "3_1",
        },
      };
      const responseData = await processJsonMessage("test", requestData);
      const count = responseData.response.conversations.length;

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.conversations, undefined);
      assert.strictEqual(count, numberOf);
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
              gt: filterUpdateAt,
            },
          },
          id: "3_3",
        },
      };
      const responseData = await processJsonMessage("test", requestData);
      const count = responseData.response.conversations.length;
      const checkDate =
        responseData.response.conversations[0].updated_at > filterUpdateAt;

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

    after(async () => {
      function ClearArray() {
        ArrayOfTmpConversaionts.forEach(async (id) => {
          const requestData = {
            request: {
              conversation_delete: {
                id: id,
              },
              id: "00",
            },
          };
          await processJsonMessage("test", requestData);
        });
      }
      ClearArray();
      await sendLogut("test", currentUserToken);
      currentUserToken = (await sendLogin("test", "user_4")).response.user
        .token;

      ClearArray();
      ArrayOfTmpConversaionts = [];
    });
  });

  describe("Delete Conversation", async () => {
    before(async () => {
      await sendLogut("test", currentUserToken);
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

    after(async () => {
      await sendLogut("test", currentUserToken);
      currentUserToken = (await sendLogin("test", "user_2")).response.user
        .token;
      const requestData = {
        request: {
          conversation_delete: {
            id: currentConversationId,
          },
          id: "00",
        },
      };
      await processJsonMessage("test", requestData);
    });
  });

  after(async () => {
    await sendLogut("test", currentUserToken);
    for (let i = 0; i < userId.length; i++) {
      await sendLogin("test", `user_${i + 1}`);
      const requestData = {
        request: {
          user_delete: {
            id: userId[i],
          },
          id: "00",
        },
      };
      await processJsonMessage("test", requestData);
    }
    userId = [];
  });
});
