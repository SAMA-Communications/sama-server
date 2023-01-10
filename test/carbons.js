import User from "../models/user.js";
import assert from "assert";
import { ACTIVE } from "../store/session.js";
import { connectToDBPromise } from "../lib/db.js";
import { processJsonMessageOrError } from "../routes/ws.js";
import { createUserArray, sendLogin, sendLogout } from "./utils.js";

let currentUserToken = [];
let usersIds = [];

describe("Carbons", async () => {
  before(async () => {
    await connectToDBPromise();
    usersIds = await createUserArray(2);
  });

  describe("Carbon login", async () => {
    it("should work", async () => {
      console.log("login with login user_1 -->");
      await sendLogin("ws1", "user_1", "laptop");
      await sendLogin("ws2", "user_1", "laptop");
      await sendLogin("ws3", "user_1", "laptop");
      currentUserToken = (await sendLogin("ws4", "user_1", "laptop1")).response
        .user._id;
      await sendLogin("ws5", "user_1", "mobile");
      await sendLogin("ws6", "user_1", "laptop2");

      assert.strictEqual(ACTIVE.DEVICES[currentUserToken].length, 4);
      assert.notEqual(ACTIVE.DEVICES, {});

      console.log(ACTIVE.DEVICES);
      await sendLogout("ws4", currentUserToken, "laptop1");

      assert.strictEqual(ACTIVE.DEVICES[currentUserToken].length, 3);

      console.log("ws4 logout -->\n", ACTIVE.DEVICES);
      const requestData = {
        request: {
          user_delete: {},
          id: "4_1",
        },
      };
      await processJsonMessageOrError("ws6", requestData);
      console.log("delete user -->\n", ACTIVE.DEVICES);

      assert.strictEqual(JSON.stringify(ACTIVE.DEVICES), "{}");
    });
  });

  after(async () => {
    await User.clearCollection();
  });
});
