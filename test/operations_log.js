import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";
import MessageStatus from "../models/message_status.js";
import Message from "../models/message.js";
import User from "../models/user.js";
import assert from "assert";
import { ObjectId } from "mongodb";
import { connectToDBPromise } from "../lib/db.js";
import {
  createConversation,
  createUserArray,
  mockedWS,
  sendLogin,
  sendLogout,
} from "./utils.js";
import { default as PacketProcessor } from "./../routes/delivery_manager.js";
import OperationsLogRepository from "../repositories/operations_log_repository.js";
import OpLog from "../models/operations_log.js";

let filterUpdatedAt = "";
let currentUserToken = "";
let timeWhenUserOff = null;
let currentConversationId = "";
let usersIds = [];
let messagesIds = [];
let messageId1 = "";
const controller = new OperationsLogRepository(OpLog);

describe("Operations Log functions", async () => {
  before(async () => {
    await connectToDBPromise();
    await OpLog.clearCollection();
    usersIds = await createUserArray(2);

    currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user._id;

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
      currentUserToken = (await sendLogin(mockedWS, "user_2")).response.user
        ._id;
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
        message: "Gt or lt query missed",
      });
    });

    it("should work lt param", async () => {
      console.log(timeWhenUserOff);
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
      console.log(responseData);
      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.equal(responseData.response.logs.length, 2);
    });

    it("should work gt param", async () => {
      currentUserToken = (await sendLogin(mockedWS, "user_2")).response.user
        ._id;
      console.log(timeWhenUserOff);
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
      console.log(responseData);
      assert.strictEqual(requestData.request.id, responseData.response.id);
      assert.equal(responseData.response.logs.length, 4);
    });
  });

  after(async () => {
    await User.clearCollection();
    // await OpLog.clearCollection();
    usersIds = [];
  });
});
