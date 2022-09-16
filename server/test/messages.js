import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";
import Messages from "../models/message.js";
import MessagesController from "../controllers/messages.js";
import User from "../models/user.js";
import UserSession from "../models/user_session.js";
import assert from "assert";
import { connectToDBPromise } from "../lib/db.js";
import { processJsonMessage } from "../routes/ws.js";

let filterUpdatedAt = "";
let currentUserToken = "";
let currentConversationId = "";
let userId = [];
const mockedWS = {
  send: (data) => {
    console.log("[WS] send mocked data", data);
  },
};
async function sendLogin(ws, login) {
  const requestData = {
    request: {
      user_login: {
        login: login,
        password: "1um",
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
  await processJsonMessage(ws, requestData);
}

describe("Message function", async () => {
  before(async () => {
    await connectToDBPromise();
    for (let i = 0; i < 3; i++) {
      const requestDataCreate = {
        request: {
          user_create: {
            login: `um_${i + 1}`,
            password: "1um",
          },
          id: "0",
        },
      };
      const responseData = await processJsonMessage(
        mockedWS,
        requestDataCreate
      );
      userId[i] = JSON.parse(responseData.response.user)._id;
    }
    // console.log("UserId: ", userId);
    await sendLogin(mockedWS, "um_2");
    currentUserToken = (await sendLogin(mockedWS, "um_1")).response.user.token;

    const requestData = {
      request: {
        conversation_create: {
          name: "chat5",
          description: "for admin and users",
          type: "g",
          participants: [userId[0], userId[1]],
        },
        id: "0",
      },
    };
    const responseData = await processJsonMessage(mockedWS, requestData);
    currentConversationId =
      responseData.response.conversation.params._id.toString();
  });

  describe("Send Message", async () => {
    it("should work", async () => {
      const requestData = {
        message: {
          id: "xyz",
          from: "",
          body: "hey how is going?",
          cid: currentConversationId,
          x: {
            param1: "value",
            param2: "value",
          },
        },
      };
      const responseData = await new MessagesController().create(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.message.id, responseData.ask.mid);
      assert.notEqual(responseData.ask.t, undefined);
    });

    it("should fail ID not found", async () => {
      const requestData = {
        message: {
          from: "",
          body: "hey how is going?",
          cid: currentConversationId,
          x: {
            param1: "value",
            param2: "value",
          },
        },
      };
      const responseData = await new MessagesController().create(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.message.id, undefined);
      assert.equal(responseData.ask, undefined);
      assert.deepEqual(responseData.message.error, {
        status: 422,
        message: "Message ID not found",
      });
    });

    it("should fail either 'to' or 'cid' field is required", async () => {
      const requestData = {
        message: {
          id: "xyz",
          from: "",
          body: "hey how is going?",
          x: {
            param1: "value",
            param2: "value",
          },
        },
      };
      const responseData = await new MessagesController().create(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.message.id, responseData.message.id);
      assert.equal(responseData.ask, undefined);
      assert.deepEqual(responseData.message.error, {
        status: 422,
        message: "Either 'to' or 'cid' field is required",
      });
    });

    it("should fail participant not found", async () => {
      currentUserToken = (await sendLogin(mockedWS, "um_3")).response.user
        .token;
      const requestData = {
        message: {
          id: "xyz",
          from: "",
          body: "hey how is going?",
          cid: currentConversationId,
          x: {
            param1: "value",
            param2: "value",
          },
        },
      };
      const responseData = await new MessagesController().create(
        mockedWS,
        requestData
      );
      await sendLogout(mockedWS, currentUserToken);
      await sendLogin(mockedWS, "um_1");

      assert.strictEqual(requestData.message.id, responseData.message.id);
      assert.equal(responseData.ask, undefined);
      assert.deepEqual(responseData.message.error, {
        status: 403,
        message: "Forbidden",
      });
    });

    it("should fail body of message is empty", async () => {
      const requestData = {
        message: {
          id: "xyz",
          from: "",
          body: "",
          cid: currentConversationId,
          x: {
            param1: "value",
            param2: "value",
          },
        },
      };
      const responseData = await new MessagesController().create(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.message.id, responseData.message.id);
      assert.equal(responseData.ask, undefined);
      assert.deepEqual(responseData.message.error, {
        status: 422,
        message: "Body of message is empty",
      });
    });

    it("should work create private conversation", async () => {
      const requestData = {
        message: {
          id: "messageID_9",
          to: userId[1],
          from: "",
          body: "working!!! (first)",
          x: {
            param1: "value",
            param2: "value",
          },
        },
      };
      const responseData = await new MessagesController().create(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.message.id, responseData.ask.mid);
      assert.notEqual(responseData.ask, undefined);
    });

    it("should work privete conversation message", async () => {
      const requestData = {
        message: {
          id: "messageID_10",
          to: userId[1],
          from: "",
          body: "second message!!!",
          x: {
            param1: "value",
            param2: "value",
          },
        },
      };
      const responseData = await new MessagesController().create(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.message.id, responseData.ask.mid);
      assert.notEqual(responseData.ask, undefined);
    });

    it("should work privete conversation message reverse", async () => {
      await sendLogin(mockedWS, "um_2");
      const requestData = {
        message: {
          id: "messageID_11",
          to: userId[0],
          from: "",
          body: "third message!!! (last)",
          x: {
            param1: "value",
            param2: "value",
          },
        },
      };
      const responseData = await new MessagesController().create(
        mockedWS,
        requestData
      );

      await sendLogin(mockedWS, "um_1");
      assert.strictEqual(requestData.message.id, responseData.ask.mid);
      assert.notEqual(responseData.ask, undefined);
    });
  });

  describe("List of Messages", async () => {
    before(async () => {
      for (let i = 0; i < 8; i++) {
        const requestData = {
          message: {
            id: `messageID_${i + 1}`,
            from: "",
            body: `hey bro, this is message #${i + 1}`,
            cid: currentConversationId,
            x: {
              param1: "value_1",
              param2: "value_2",
            },
          },
        };
        const responseData = await new MessagesController().create(
          mockedWS,
          requestData
        );
        if (i == 3) {
          const findMessage = await Messages.findOne({
            id: responseData.ask.mid,
          });
          filterUpdatedAt = findMessage.params.updated_at;
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
      const responseData = await new MessagesController().list(
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
      const numberOf = 4;
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
      const responseData = await new MessagesController().list(
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
      const responseData = await new MessagesController().list(
        mockedWS,
        requestData
      );
      const count = responseData.response.messages.length;

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.messages, undefined);
      assert(count <= numberOf, "limit filter does not work");
      assert.equal(responseData.response.error, undefined);
    });

    after(async () => {
      for (let i = 0; i < 10; i++) {
        const requestData = {
          request: {
            message_delete: {
              id: `messageID_${i + 1}`,
              from: userId[0],
            },
            id: "00",
          },
        };
        await new MessagesController().delete(mockedWS, requestData);
      }
    });
  });

  describe("Delete Message", async () => {
    it("should work", async () => {
      const requestData = {
        request: {
          message_delete: {
            id: "xyz",
            from: userId[0],
          },
          id: "7",
        },
      };
      const responseData = await new MessagesController().delete(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.message.id);
      assert.notEqual(responseData.message.success, undefined);
      assert.equal(responseData.message.error, undefined);
    });
  });

  after(async () => {
    await User.clearCollection();
    await UserSession.clearCollection();
    await Messages.clearCollection();
    await Conversation.clearCollection();
    await ConversationParticipant.clearCollection();
    userId = [];
  });
});
