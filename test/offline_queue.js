import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";
import Messages from "../models/message.js";
import OfflineQueue from "../models/offline_queue.js";
import User from "../models/user.js";
import { connectToDBPromise } from "../lib/db.js";
import {
  createConversation,
  createUserArray,
  mockedWS,
  sendLogin,
  sendLogout,
} from "./utils.js";
import { processJsonMessageOrError } from "../routes/ws.js";

let currentUserToken = "";
let userId = [];
let currentConversationId = "";

describe("User EXPECTED requests", async () => {
  before(async () => {
    await connectToDBPromise();
    userId = await createUserArray(3);
    currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user
      .token;

    currentConversationId = await createConversation(
      mockedWS,
      null,
      null,
      "g",
      [userId[1], userId[2], userId[0]]
    );
  });

  it("should work #1", async () => {
    console.log("<-- user_1 sent message (group) -->");
    let requestData = {
      message: {
        id: "message1",
        body: "Hey! Group conversations",
        cid: currentConversationId,
      },
    };
    await processJsonMessageOrError(mockedWS, requestData);

    console.log("<-- user_1 sent message (private) -->");
    requestData = {
      message: {
        id: "message2",
        body: "Hey! Private conversations",
        to: userId[1],
      },
    };
    await processJsonMessageOrError(mockedWS, requestData);

    requestData = {
      message: {
        id: "message3",
        body: "Hey! Private conversations (second message)",
        to: userId[1],
      },
    };
    await processJsonMessageOrError(mockedWS, requestData);
  });

  it("should work #2", async () => {
    let requestData = {
      request: {
        message_edit: {
          id: "message1",
          body: "Updated body in this message",
        },
        id: "12",
      },
    };
    await processJsonMessageOrError(mockedWS, requestData);

    console.log("<-- user_2 go online -->");
    await sendLogout(mockedWS, currentUserToken);
    await sendLogin(mockedWS, "user_2");

    requestData = {
      request: {
        message_delete: {
          cid: currentConversationId,
          ids: ["message3"],
          type: "all",
        },
        id: "21",
      },
    };
    await processJsonMessageOrError(mockedWS, requestData);

    console.log("<-- user_3 go online -->");
    await sendLogin(mockedWS, "user_3");
  });

  after(async () => {
    await User.clearCollection();
    await OfflineQueue.clearCollection();
    await Messages.clearCollection();
    await Conversation.clearCollection();
    await ConversationParticipant.clearCollection();
    userId = [];
  });
});
