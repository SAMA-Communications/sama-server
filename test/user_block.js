import BlockedUser from "../models/blocked_user.js";
import User from "../models/user.js";
import assert from "assert";
import { connectToDBPromise } from "../lib/db.js";
import { createUserArray, mockedWS, sendLogin } from "./utils.js";
import { processJsonMessageOrError } from "../routes/ws.js";

let currentUserToken = "";
let userId = [];

describe("UserBlocked functions", async () => {
  before(async () => {
    await connectToDBPromise();
    userId = await createUserArray(5);
    currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user._id;
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
