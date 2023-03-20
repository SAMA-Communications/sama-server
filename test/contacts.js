import User from "./../app/models/user.js";
import assert from "assert";
import { connectToDBPromise } from "./../app/lib/db.js";
import { createUserArray, mockedWS, sendLogin } from "./utils.js";
import { default as PacketProcessor } from "./../app/routes/packet_processor.js";

let usersIds = [];

describe("Operations Log functions", async () => {
  before(async () => {
    await connectToDBPromise();
    usersIds = await createUserArray(2);

    await sendLogin(mockedWS, "user_1");
  });

  describe("Get record from OpLog", async () => {
    it("should fail", async () => {});

    it("should work", async () => {});
  });

  after(async () => {
    await User.clearCollection();
    usersIds = [];
  });
});
