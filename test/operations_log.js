import OpLog from "./../app/models/operations_log.js";
import OperationsLogRepository from "./../app/repositories/operations_log_repository.js";
import User from "./../app/models/user.js";
import assert from "assert";
import { connectToDBPromise } from "./../app/lib/db.js";
import { createUserArray, mockedWS, sendLogin } from "./utils.js";
import { default as PacketProcessor } from "./../app/routes/packet_processor.js";

let timeWhenUserOff = null;
let usersIds = [];
const controller = new OperationsLogRepository(OpLog);

describe("Operations Log functions", async () => {
  before(async () => {
    await connectToDBPromise();
    await OpLog.clearCollection();
    usersIds = await createUserArray(2);

    await sendLogin(mockedWS, "user_1");

    for (let i = 0; i < 2; i++) {
      controller.savePacket(usersIds[1], {
        message_update: {
          id: `mid${i}`,
          body: `body${i}`,
        },
      });
    }
  });

  describe("Get record from OpLog", async () => {
    it("should fail", async () => {
      await sendLogin(mockedWS, "user_2");

      const requestData = {
        request: {
          op_log_list: {
            created_at: {
              lt: null,
            },
          },
          id: "lt_sample",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.equal(responseData.response.logs, undefined);
      assert.deepEqual(responseData.response.error, {
        status: 422,
        message: "Gt or lt query missed.",
      });
    });

    it("should work lt param", async () => {
      timeWhenUserOff = new Date();
      const requestData = {
        request: {
          op_log_list: {
            created_at: {
              lt: timeWhenUserOff,
            },
          },
          id: "lt_sample",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );
      for (let i = 2; i < 6; i++) {
        controller.savePacket(usersIds[1], {
          message_update: {
            id: `mid${i}`,
            body: `body${i}`,
          },
        });
      }

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.equal(responseData.response.logs.length, 2);
    });

    it("should work gt param", async () => {
      await sendLogin(mockedWS, "user_2");

      const requestData = {
        request: {
          op_log_list: {
            created_at: {
              gt: timeWhenUserOff,
            },
          },
          id: "gt_sample",
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.equal(responseData.response.logs.length, 4);
    });
  });

  after(async () => {
    await User.clearCollection();
    await OpLog.clearCollection();
    usersIds = [];
  });
});
