import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";
import MessageStatus from "../models/message_status.js";
import Message from "../models/message.js";
import User from "../models/user.js";
import assert from "assert";
import { connectToDBPromise } from "../lib/db.js";
import {
  createConversation,
  createUserArray,
  mockedWS,
  sendLogin,
  sendLogout,
} from "./utils.js";
import { default as PacketProcessor } from "./../routes/delivery_manager.js";

let filterUpdatedAt = "";
let currentUserToken = "";
let currentConversationId = "";
let usersIds = [];
let messagesIds = [];
let messageId1 = "";

describe("Message function", async () => {
  before(async () => {
    await connectToDBPromise();
    usersIds = await createUserArray(3);

    currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user._id;

    currentConversationId = await createConversation(
      mockedWS,
      null,
      null,
      "g",
      [usersIds[1], usersIds[0]]
    );

    //up second user at redis and ws
  });

  describe("Send Message", async () => {
    it("should work", async () => {
      const requestData = {
        message: {
          id: "xyz",
          body: "hey how is going?",
          cid: currentConversationId,
        },
      };

      const responseData = await PacketProcessor.processJsonMessageOrError(
        mockedWS,
        requestData
      );

      assert.strictEqual(requestData.message.id, responseData.ask.mid);
      assert.notEqual(responseData.ask.t, undefined);
    });
  });

  after(async () => {
    await User.clearCollection();
    await Message.clearCollection();
    await MessageStatus.clearCollection();
    await Conversation.clearCollection();
    await ConversationParticipant.clearCollection();
    usersIds = [];
  });
});
