import User from "../models/user.js";
import assert from "assert";
import { connectToDBPromise } from "../lib/db.js";
import { processJsonMessageOrError } from "../routes/ws.js";
import { ACTIVE } from "../models/active.js";

let currentUserToken = [];
let userId = [];

async function sendLogin(ws, login, device) {
  const requestData = {
    request: {
      user_login: {
        login: login,
        deviceId: device,
        password: "user_paswword_1",
      },
      id: "0101",
    },
  };
  const response = await processJsonMessageOrError(ws, requestData);
  return response;
}
async function sendLogout(ws, currentUserToken, device) {
  const requestData = {
    request: {
      user_logout: {},
      id: "0102",
    },
  };
  const responseData = await processJsonMessageOrError(ws, requestData);
}

describe("Carbons", async () => {
  before(async () => {
    await connectToDBPromise();
    for (let i = 0; i < 2; i++) {
      const requestData = {
        request: {
          user_create: {
            deviceId: "PC",
            login: `um_${i + 1}`,
            password: "user_paswword_1",
          },
          id: "1_1",
        },
      };
      const responseData = await processJsonMessageOrError(
        "create",
        requestData
      );
      userId[i] = responseData.response.user._id;
    }
  });

  describe("Carbon login", async () => {
    it("should work", async () => {
      console.log("login with login um_1 -->");
      await sendLogin("ws1", "um_1", "laptop");
      await sendLogin("ws2", "um_1", "laptop");
      await sendLogin("ws3", "um_1", "laptop");
      currentUserToken = (await sendLogin("ws4", "um_1", "laptop1")).response
        .user._id;
      await sendLogin("ws5", "um_1", "mobile");
      await sendLogin("ws6", "um_1", "laptop2");

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
