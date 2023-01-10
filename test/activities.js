import User from "../models/user.js";
import assert from "assert";
import { ACTIVITY } from "../store/activity.js";
import { connectToDBPromise, getClient } from "../lib/db.js";
import { processJsonMessageOrError } from "../routes/ws.js";
import { createUserArray, sendLogin, sendLogout } from "./utils.js";

let currentUserToken1 = "";
let currentUserToken = "";
let userId = [];

describe("User activities", async () => {
  before(async () => {
    await connectToDBPromise();
    userId = await createUserArray(3);
    currentUserToken1 = (await sendLogin("line_2", "user_3")).response.user
      .token;
    currentUserToken = (await sendLogin("line_1", "user_1")).response.user
      .token;
  });

  it("should work subscribe", async () => {
    const requestData = {
      request: {
        user_last_activity_subscribe: {
          id: userId[1],
        },
        id: "1",
      },
    };
    const responseData = await processJsonMessageOrError("line_1", requestData);

    assert.strictEqual(responseData.response.id, requestData.request.id);
    assert.equal(ACTIVITY.SUBSCRIBED_TO[userId[0]], userId[1]);
    assert.notEqual(ACTIVITY.SUBSCRIBERS[userId[1]][userId[0]], undefined);
    assert.notEqual(responseData.response.last_activity, undefined);
  });

  it("should fail user ID missed", async () => {
    const requestData = {
      request: {
        user_last_activity_subscribe: {},
        id: "1",
      },
    };
    const responseData = await processJsonMessageOrError("line_1", requestData);

    assert.strictEqual(responseData.response.id, requestData.request.id);
    assert.deepEqual(responseData.response.error, {
      status: 422,
      message: "User ID missed",
    });
  });

  it("should work unsubscribe #1", async () => {
    let requestData = {
      request: {
        user_last_activity_subscribe: {
          id: userId[1],
        },
        id: "1",
      },
    };
    let responseData = await processJsonMessageOrError("line_2", requestData);

    requestData = {
      request: {
        user_last_activity_unsubscribe: {},
        id: "1",
      },
    };
    responseData = await processJsonMessageOrError("line_1", requestData);
    await sendLogout("line_1", currentUserToken);

    assert.strictEqual(responseData.response.id, requestData.request.id);
    assert.strictEqual(responseData.response.success, true);
    assert.equal(ACTIVITY.SUBSCRIBED_TO[userId[0]], undefined);
    assert.notEqual(ACTIVITY.SUBSCRIBERS[userId[1]], undefined);
    assert.equal(ACTIVITY.SUBSCRIBERS[userId[1]][userId[0]], undefined);
  });

  it("should work getUserStatus", async () => {
    const requestData = {
      request: {
        user_last_activity: {
          ids: [userId[2], userId[0]],
        },
        id: "1",
      },
    };
    const responseData = await processJsonMessageOrError("line_2", requestData);

    assert.strictEqual(responseData.response.id, requestData.request.id);
    assert.notEqual(responseData.response.last_activity, undefined);
    assert.equal(responseData.response.last_activity[userId[2]], "online");
  });

  it("should work unsubscribe #2", async () => {
    const requestData = {
      request: {
        user_last_activity_unsubscribe: {},
        id: "1",
      },
    };
    const responseData = await processJsonMessageOrError("line_2", requestData);

    assert.strictEqual(responseData.response.id, requestData.request.id);
    assert.strictEqual(responseData.response.success, true);
    assert.equal(ACTIVITY.SUBSCRIBED_TO[userId[2]], undefined);
    assert.equal(ACTIVITY.SUBSCRIBERS[userId[1]], undefined);

    await sendLogout("line_2", currentUserToken1);
  });

  after(async () => {
    await User.clearCollection();
    await getClient().close();
  });
});
