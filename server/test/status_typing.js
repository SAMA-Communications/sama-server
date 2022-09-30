import User from "../models/user.js";
import UserSession from "../models/user_session.js";
import assert from "assert";
import { connectToDBPromise, getClient } from "../lib/db.js";
import { processJsonMessageOrError } from "../routes/ws.js";

let currentConversationId = "";
let currentUserToken = "";
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
        password: "user_password_1",
      },
      id: "0101",
    },
  };
  const response = await processJsonMessageOrError(ws, requestData);
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
  await processJsonMessageOrError(ws, requestData);
}

describe("Sending 'typing' status", async () => {
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
      userId[i] = JSON.parse(responseData.response.user)._id;
    }
    currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user
      .token;
    const requestData = {
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
    const responseData = await processJsonMessageOrError(mockedWS, requestData);
    currentConversationId =
      responseData.response.conversation.params._id.toString();
    await sendLogout(mockedWS, currentUserToken);
  });

  it("should fail user not login", async () => {
    const requestData = {
      typing: {
        id: "xyz",
        type: "start",
        cid: currentConversationId,
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);

    assert.strictEqual(responseData.typing.user, undefined);
    assert.deepEqual(responseData.typing.error, {
      status: 404,
      message: "Unauthorized",
    });

    currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user
      .token;
  });

  it("should fail id missed", async () => {
    const requestData = {
      typing: {
        type: "start",
        cid: currentConversationId,
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);

    assert.strictEqual(responseData.typing.user, undefined);
    assert.deepEqual(responseData.typing.error, {
      status: 422,
      message: "Status ID missed",
    });
  });

  it("should fail type missed", async () => {
    const requestData = {
      typing: {
        id: "xyz",
        cid: currentConversationId,
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);

    assert.strictEqual(responseData.typing.user, undefined);
    assert.deepEqual(responseData.typing.error, {
      status: 422,
      message: "Status Type missed",
    });
  });

  it("should fail type incorrect", async () => {
    const requestData = {
      typing: {
        id: "xyz",
        type: "asdvsa123",
        cid: currentConversationId,
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);

    assert.strictEqual(responseData.typing.user, undefined);
    assert.deepEqual(responseData.typing.error, {
      status: 422,
      message: "Incorrect type",
    });
  });

  it("should fail cid or to missed", async () => {
    const requestData = {
      typing: {
        id: "xyz",
        type: "start",
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);

    assert.strictEqual(responseData.typing.user, undefined);
    assert.deepEqual(responseData.typing.error, {
      status: 422,
      message: "Either 'to' or 'cid' field is required",
    });
  });

  it("should fail conversation not found", async () => {
    const requestData = {
      typing: {
        id: "xyz",
        type: "start",
        cid: "currentConversationId",
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);

    assert.strictEqual(responseData.typing.user, undefined);
    assert.deepEqual(responseData.typing.error, {
      status: 404,
      message: "Conversation not found",
    });
  });

  it("should work", async () => {
    const requestData = {
      typing: {
        id: "xyz",
        type: "start",
        cid: currentConversationId,
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);
    assert.strictEqual(responseData, undefined);
  });

  after(async () => {
    await User.clearCollection();
    await UserSession.clearCollection();
    await getClient().close();
  });
});
