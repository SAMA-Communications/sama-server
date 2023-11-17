import BlockedUser from "./../app/models/blocked_user.js";
import User from "./../app/models/user.js";
import UserToken from "../app/models/user_token.js";
import assert from "assert";
import { connectToDBPromise } from "./../app/lib/db.js";
import { createUserArray, mockedWS, sendLogin } from "./utils.js";
import packetJsonProcessor from "../APIs/JSON/routes/packet_processor.js";

let usersIds = [];

describe("UserBlocked functions", async () => {
  before(async () => {
    await connectToDBPromise();
    await User.clearCollection();
    await UserToken.clearCollection();
    usersIds = await createUserArray(5);
    await sendLogin(mockedWS, "user_1");
  });

  describe("Block method", async () => {
    it("should work, block user_2", async () => {
      const requestData = {
        request: {
          block_user: {
            id: usersIds[1],
          },
          id: 2,
        },
      };
      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.success, true);
    });

    it("should work, block user_3", async () => {
      const requestData = {
        request: {
          block_user: {
            id: usersIds[2],
          },
          id: 3,
        },
      };
      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.success, true);
    });

    it("should work, block user_4", async () => {
      const requestData = {
        request: {
          block_user: {
            id: usersIds[3],
          },
          id: 4,
        },
      };
      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.success, true);
    });

    it("should work, block user_5", async () => {
      const requestData = {
        request: {
          block_user: {
            id: usersIds[4],
          },
          id: 5,
        },
      };
      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
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
      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
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
      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
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
            id: usersIds[1],
          },
          id: 2,
        },
      };
      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.success, true);
    });

    it("should work, unblock user_4", async () => {
      const requestData = {
        request: {
          unblock_user: {
            id: usersIds[3],
          },
          id: 3,
        },
      };
      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
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
      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
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
      const responseData = await packetJsonProcessor.processMessageOrError(
        mockedWS,
        JSON.stringify(requestData)
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.users, undefined);
      assert.equal(responseData.response.users.length, 2);
    });
  });

  after(async () => {
    await User.clearCollection();
    await BlockedUser.clearCollection();
    usersIds = [];
  });
});
