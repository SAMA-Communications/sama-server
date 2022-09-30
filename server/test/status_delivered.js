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
  const response = await processJsonMessageOrError(mockedWS, requestData);
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
  await processJsonMessageOrError(mockedWS, requestData);
}

describe("Sending 'delivered' status", async () => {
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
    currentConversationId =
      responseData.response.conversation.params._id.toString();

    requestData = {
      message: {
        id: "message1234",
        body: "hey how is going?",
        cid: currentConversationId,
      },
    };
    responseData = await processJsonMessageOrError(mockedWS, requestData);
    await sendLogout(mockedWS, currentUserToken);
  });

  it("should fail id missed", async () => {
    currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user
      .token;
    const requestData = {
      delivered: {
        type: "start",
        mid: "message1234",
        cid: currentConversationId,
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);

    assert.strictEqual(responseData.delivered.user, undefined);
    assert.deepEqual(responseData.delivered.error, {
      status: 422,
      message: "Status ID missed",
    });
  });

  it("should fail mid missed", async () => {
    const requestData = {
      delivered: {
        id: "xyz",
        cid: currentConversationId,
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);

    assert.strictEqual(responseData.delivered.user, undefined);
    assert.deepEqual(responseData.delivered.error, {
      status: 422,
      message: "Message ID missed",
    });
  });

  it("should fail mid incorrect", async () => {
    const requestData = {
      delivered: {
        id: "xyz",
        mid: "1235435",
        cid: currentConversationId,
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);

    assert.strictEqual(responseData.delivered.user, undefined);
    assert.deepEqual(responseData.delivered.error, {
      status: 422,
      message: "Message ID not found",
    });
  });

  it("should fail cid or to missed", async () => {
    const requestData = {
      delivered: {
        id: "xyz",
        mid: "message1234",
        type: "start",
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);

    assert.strictEqual(responseData.delivered.user, undefined);
    assert.deepEqual(responseData.delivered.error, {
      status: 422,
      message: "Either 'to' or 'cid' field is required",
    });
  });

  it("should fail conversation not found", async () => {
    const requestData = {
      delivered: {
        id: "xyz",
        type: "start",
        mid: "message1234",
        cid: "currentConversationId",
      },
    };
    const responseData = await processJsonMessageOrError(mockedWS, requestData);

    assert.strictEqual(responseData.delivered.user, undefined);
    assert.deepEqual(responseData.delivered.error, {
      status: 404,
      message: "Conversation not found",
    });
  });

  it("should work", async () => {
    const requestData = {
      delivered: {
        id: "xyz",
        type: "start",
        mid: "message1234",
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
