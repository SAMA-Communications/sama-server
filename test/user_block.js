import User from "../models/user.js";
import assert from "assert";
import { connectToDBPromise } from "../lib/db.js";
import { processJsonMessageOrError } from "../routes/ws.js";
import BlockedUser from "../models/blocked_user.js";

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
        deviceId: `${login}${Math.random() * 10000}`,
        login: login,
        password: "1um",
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
      user_logout: {},
      id: "0102",
    },
  };
  await processJsonMessageOrError(ws, requestData);
}

describe("UserBlocked functions", async () => {
  before(async () => {
    await connectToDBPromise();
    for (let i = 0; i < 5; i++) {
      const requestDataCreate = {
        request: {
          user_create: {
            login: `um_${i + 1}`,
            password: "1um",
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
    currentUserToken = (await sendLogin(mockedWS, "um_1")).response.user._id;
  });

  describe("Block method", async () => {
    it("should work, block user_2", async () => {
      const requestData = {
        request: {
          block_user: {
            id: userId[1],
          },
          id: 2,
        },
      };
      const responseData = await processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.success, true);
    });

    it("should work, block user_3", async () => {
      const requestData = {
        request: {
          block_user: {
            id: userId[2],
          },
          id: 3,
        },
      };
      const responseData = await processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.success, true);
    });

    it("should work, block user_4", async () => {
      const requestData = {
        request: {
          block_user: {
            id: userId[3],
          },
          id: 4,
        },
      };
      const responseData = await processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.success, true);
    });

    it("should work, block user_5", async () => {
      const requestData = {
        request: {
          block_user: {
            id: userId[4],
          },
          id: 5,
        },
      };
      const responseData = await processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.success, true);
    });

    it("should fail, id missed", async () => {
      const requestData = {
        request: {
          block_user: {
            id: "",
          },
          id: 6,
        },
      };
      const responseData = await processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.success, true);
    });
  });

  describe("List method", async () => {
    it("should work", async () => {
      const requestData = {
        request: {
          list_blocked_users: {},
          id: 2,
        },
      };
      const responseData = await processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.users, undefined);
      assert.equal(responseData.response.users.length, 4);
    });
  });

  describe("Unblock method", async () => {
    it("should work, unblock user_2", async () => {
      const requestData = {
        request: {
          unblock_user: {
            id: userId[1],
          },
          id: 2,
        },
      };
      const responseData = await processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.success, true);
    });

    it("should work, unblock user_4", async () => {
      const requestData = {
        request: {
          unblock_user: {
            id: userId[3],
          },
          id: 3,
        },
      };
      const responseData = await processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.success, true);
    });

    it("should fail, id missed", async () => {
      const requestData = {
        request: {
          unblock_user: {
            id: "",
          },
          id: 6,
        },
      };
      const responseData = await processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.success, true);
    });

    it("check blocked list again", async () => {
      const requestData = {
        request: {
          list_blocked_users: {},
          id: 2,
        },
      };
      const responseData = await processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.users, undefined);
      assert.equal(responseData.response.users.length, 2);
    });
  });

  after(async () => {
    await User.clearCollection();
    await BlockedUser.clearCollection();
    userId = [];
  });
});
