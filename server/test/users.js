import User from "../models/user.js";
import assert from "assert";
import { connectToDBPromise, getClient } from "../lib/db.js";
import { processJsonMessageOrError } from "../routes/ws.js";

const userLogin = [...Array(30)]
  .map(() => Math.random().toString(36)[2])
  .join("");
let currentUserToken = "";

describe("User cycle", async () => {
  before(async () => {
    await connectToDBPromise();
  });

  after(async () => {
    await getClient().close();
  });

  describe("Create User", async () => {
    it("should work", async () => {
      const requestData = {
        request: {
          user_create: {
            login: userLogin,
            password: "user_paswword_1",
          },
          id: "1_1",
        },
      };
      const responseData = await processJsonMessageOrError("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.user, undefined);
      assert.equal(responseData.response.error, undefined);
    });

    it("should fail when login already taken", async () => {
      const requestData = {
        request: {
          user_create: {
            login: userLogin,
            password: "user_paswword_1",
          },
          id: "1_2",
        },
      };
      const responseData = await processJsonMessageOrError("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.user, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "User already exists",
      });
    });
  });

  describe("Login User", async () => {
    it("should fail because the user does not exist", async () => {
      const requestData = {
        request: {
          user_login: {
            deviceId: "PC",
            login: "user_testtttt",
            password: "user_paswword_1",
          },
          id: "2_1",
        },
      };
      let responseData = {};
      try {
        responseData = await processJsonMessageOrError("test", requestData);
      } catch (e) {
        responseData = {
          response: {
            id: responseData.id,
            error: error.cause,
          },
        };
      }

      assert.strictEqual(responseData.response.user, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 404,
        message: "Unauthorized",
      });
    });

    it("should fail because the password is incorrect", async () => {
      const requestData = {
        request: {
          user_login: {
            deviceId: "PC",
            login: userLogin,
            password: "Invalid_password213",
          },
          id: "2_2",
        },
      };
      const responseData = await processJsonMessageOrError("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.user, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 404,
        message: "Unauthorized",
      });
    });

    it("should fail 'deviceId' is required", async () => {
      const requestData = {
        request: {
          user_login: {
            login: userLogin,
            password: "Invalid_password213",
          },
          id: "3_2",
        },
      };
      const responseData = await processJsonMessageOrError("xc", requestData);

      assert.strictEqual(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "'deviceId' is required",
      });
    });

    it("should work", async () => {
      const requestData = {
        request: {
          user_login: {
            deviceId: "PC",
            login: userLogin,
            password: "user_paswword_1",
          },
          id: "2_3",
        },
      };
      const responseData = await processJsonMessageOrError("test", requestData);
      currentUserToken = responseData.response.user._id;

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.user, undefined);
      assert.equal(responseData.response.error, undefined);
    });
  });

  describe("Logout User", async () => {
    it("should work", async () => {
      const requestData = {
        request: {
          user_logout: {},
          id: "3_1",
        },
      };
      const responseData = await processJsonMessageOrError("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notStrictEqual(responseData.response.success, undefined);
      assert.equal(responseData.response.error, undefined);
    });

    it("should fail user isn`t online", async () => {
      const requestData = {
        request: {
          user_logout: {},
          id: "3_2",
        },
      };
      const responseData = await processJsonMessageOrError("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 404,
        message: "Unauthorized",
      });
    });
  });

  describe("Delete User", async () => {
    it("should fail user not login", async () => {
      let requestData = {
        request: {
          user_delete: {},
          id: "4_2",
        },
      };
      const responseData = await processJsonMessageOrError("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.strictEqual(responseData.response.success, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 404,
        message: "Unauthorized",
      });

      requestData = {
        request: {
          user_login: {
            deviceId: "PC",
            login: userLogin,
            password: "user_paswword_1",
          },
          id: "2_3",
        },
      };
      await processJsonMessageOrError("test", requestData);
    });

    it("should work", async () => {
      const requestData = {
        request: {
          user_delete: {},
          id: "4_1",
        },
      };
      const responseData = await processJsonMessageOrError("test", requestData);

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.notEqual(responseData.response.success, undefined);
      assert.equal(responseData.response.error, undefined);
    });
  });
});
