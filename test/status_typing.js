import User from "./../app/models/user.js";
import assert from "assert";
import { connectToDBPromise, getClient } from "./../app/lib/db.js";
import {
  createConversation,
  createUserArray,
  mockedWS,
  sendLogin,
  sendLogout,
} from "./utils.js";
import { default as PacketProcessor } from "./../app/routes/packet_processor.js";

let currentConversationId = "";
let currentUserToken = "";
let userId = [];

describe("Sending 'typing' status", async () => {
  before(async () => {
    await connectToDBPromise();
    userId = await createUserArray(2);

    currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user
      .token;

    currentConversationId = await createConversation(
      mockedWS,
      null,
      null,
      "g",
      [userId[1], userId[0]]
    );

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
    const responseData = await PacketProcessor.processJsonMessageOrError(
      mockedWS,
      requestData
    );

    assert.strictEqual(responseData.typing.user, undefined);
    assert.deepEqual(responseData.typing.error, {
      status: 404,
      message: "Unauthorized.",
    });

    await sendLogin(mockedWS, "user_1");
  });

  it("should fail id missed", async () => {
    const requestData = {
      typing: {
        type: "start",
        cid: currentConversationId,
      },
    };
    const responseData = await PacketProcessor.processJsonMessageOrError(
      mockedWS,
      requestData
    );

    assert.strictEqual(responseData.typing.user, undefined);
    assert.deepEqual(responseData.typing.error, {
      status: 422,
      message: "Status ID missed.",
    });
  });

  it("should fail type missed", async () => {
    const requestData = {
      typing: {
        id: "xyz",
        cid: currentConversationId,
      },
    };
    const responseData = await PacketProcessor.processJsonMessageOrError(
      mockedWS,
      requestData
    );

    assert.strictEqual(responseData.typing.user, undefined);
    assert.deepEqual(responseData.typing.error, {
      status: 422,
      message: "Status type missed.",
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
    const responseData = await PacketProcessor.processJsonMessageOrError(
      mockedWS,
      requestData
    );

    assert.strictEqual(responseData.typing.user, undefined);
    assert.deepEqual(responseData.typing.error, {
      status: 422,
      message: "The type you entered is incorrect.",
    });
  });

  it("should fail cid or to missed", async () => {
    const requestData = {
      typing: {
        id: "xyz",
        type: "start",
      },
    };
    const responseData = await PacketProcessor.processJsonMessageOrError(
      mockedWS,
      requestData
    );

    assert.strictEqual(responseData.typing.user, undefined);
    assert.deepEqual(responseData.typing.error, {
      status: 422,
      message: "'cid' field is required.",
    });
  });

  it("should fail Conversation not found.", async () => {
    const requestData = {
      typing: {
        id: "xyz",
        type: "start",
        cid: "currentConversationId",
        t: 15673838833,
      },
    };
    const responseData = await PacketProcessor.processJsonMessageOrError(
      mockedWS,
      requestData
    );

    assert.strictEqual(responseData.typing.user, undefined);
    assert.deepEqual(responseData.typing.error, {
      status: 404,
      message: "Conversation not found.",
    });
  });

  it("should work", async () => {
    const requestData = {
      typing: {
        id: "xyz",
        type: "start",
        cid: currentConversationId,
        t: 15673838833,
      },
    };
    const responseData = await PacketProcessor.processJsonMessageOrError(
      mockedWS,
      requestData
    );
    assert.strictEqual(responseData, undefined);
  });

  after(async () => {
    await User.clearCollection();
    await getClient().close();
  });
});
