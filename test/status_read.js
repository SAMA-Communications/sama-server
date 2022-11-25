import User from "../models/user.js";
import assert from "assert";
import { connectToDBPromise, getClient } from "../lib/db.js";
import { processJsonMessageOrError } from "../routes/ws.js";

let currentConversationId = "";
let currentUserToken = "";
let userId = [];
let messageId = "";

const mockedWS = {
  send: (data) => {
    console.log("[WS] send mocked data", data);
  },
};

async function sendLogin(ws, login) {
  const requestData = {
    request: {
      user_login: {
        deviceId: "PC",
        login: login,
        password: "user_password_1",
      },
      id: "0101",
    },
  };
  const response = await processJsonMessageOrError(mockedWS, requestData);
  return response;
}
async function sendLogout(ws, currentUserToken) {
  const requestData = {
    request: {
      user_logout: {},
      id: "0102",
    },
  };
  await processJsonMessageOrError(mockedWS, requestData);
}

describe("Sending 'read' status", async () => {
  before(async () => {
    await connectToDBPromise();
    for (let i = 0; i < 2; i++) {
      const requestDataCreate = {
        request: {
          user_create: {
            login: `user_${i + 1}`,
            password: "user_password_1",
          },
          id: "0",
        },
      };
      const responseData = await processJsonMessageOrError(
        mockedWS,
        requestDataCreate
      );
      userId[i] = responseData.response.user._id;
    }
    currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user
      .token;
    let requestData = {
      request: {
        conversation_create: {
          name: "group conversations",
          description: "description group",
          type: "g",
          participants: [userId[1], userId[0]],
        },
        id: "1",
      },
    };
    let responseData = await processJsonMessageOrError(mockedWS, requestData);
    currentConversationId = responseData.response.conversation._id.toString();

    requestData = {
      message: {
        id: "message1234",
        body: "hey how is going?",
        cid: currentConversationId,
      },
    };
    responseData = await processJsonMessageOrError(mockedWS, requestData);
    messageId = responseData.ask.server_mid;
    await sendLogout(mockedWS, currentUserToken);
  });

  it("should fail user not login", async () => {
    const requestData = {
      read: {
        id: "xyz",
        mid: "message1234",
        cid: currentConversationId,
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);

    assert.strictEqual(responseData.read.user, undefined);
    assert.deepEqual(responseData.read.error, {
      status: 404,
      message: "Unauthorized",
    });

    currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user
      .token;
  });

  it("should fail id missed", async () => {
    const requestData = {
      read: {
        type: "start",
        mid: "message1234",
        cid: currentConversationId,
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);

    assert.strictEqual(responseData.read.user, undefined);
    assert.deepEqual(responseData.read.error, {
      status: 422,
      message: "Status ID missed",
    });
  });

  it("should fail mid missed", async () => {
    const requestData = {
      read: {
        id: "xyz",
        cid: currentConversationId,
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);

    assert.strictEqual(responseData.read.user, undefined);
    assert.deepEqual(responseData.read.error, {
      status: 422,
      message: "Message ID missed",
    });
  });

  it("should fail mid incorrect", async () => {
    const requestData = {
      read: {
        id: "xyz",
        mid: "1235435",
        cid: currentConversationId,
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);

    assert.strictEqual(responseData.read.user, undefined);
    assert.deepEqual(responseData.read.error, {
      status: 422,
      message: "Message ID not found",
    });
  });

  it("should fail cid or to missed", async () => {
    const requestData = {
      read: {
        id: "xyz",
        mid: "message1234",
        type: "start",
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);

    assert.strictEqual(responseData.read.user, undefined);
    assert.deepEqual(responseData.read.error, {
      status: 422,
      message: "Either 'to' or 'cid' field is required",
    });
  });

  it("should fail conversation not found", async () => {
    const requestData = {
      read: {
        id: "xyz",
        type: "start",
        mid: "message1234",
        cid: "currentConversationId",
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);

    assert.strictEqual(responseData.read.user, undefined);
    assert.deepEqual(responseData.read.error, {
      status: 404,
      message: "Conversation not found",
    });
  });

  it("should work", async () => {
    const requestData = {
      read: {
        id: "xyz",
        type: "start",
        mid: messageId,
        cid: currentConversationId,
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);

    assert.strictEqual(responseData, undefined);
  });

  after(async () => {
    await User.clearCollection();
    await getClient().close();
  });
});
