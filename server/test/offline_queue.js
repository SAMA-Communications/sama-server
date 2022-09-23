import Conversation from "../models/conversation.js";
import ConversationController from "../controllers/conversations.js";
import ConversationParticipant from "../models/conversation_participant.js";
import Messages from "../models/message.js";
import MessagesController from "../controllers/messages.js";
import OfflineQueue from "../models/offline_queue.js";
import User from "../models/user.js";
import UserSession from "../models/user_session.js";
import { connectToDBPromise } from "../lib/db.js";
import { processJsonMessage } from "../routes/ws.js";

let currentUserToken = "";
let userId = [];
let currentConversationId = "";

const mockedWS = {
  send: (data) => {
    console.log("[WS] send mocked data", data);
  },
};

async function sendLogin(ws, login) {
  const requestData = {
    request: {
      user_login: {
        login: login,
        password: "user_password_1",
      },
      id: "0101",
    },
  };
  const response = await processJsonMessage(ws, requestData);
  return response;
}
async function sendLogout(ws, currentUserToken) {
  const requestData = {
    request: {
      user_logout: {
        token: currentUserToken,
      },
      id: "0102",
    },
  };
  await processJsonMessage("test", requestData);
}

describe("User EXPECTED requests", async () => {
  before(async () => {
    await connectToDBPromise();
    for (let i = 0; i < 3; i++) {
      const requestDataCreate = {
        request: {
          user_create: {
            login: `user_${i + 1}`,
            password: "user_password_1",
          },
          id: "0",
        },
      };
      const responseData = await processJsonMessage(
        mockedWS,
        requestDataCreate
      );
      userId[i] = JSON.parse(responseData.response.user)._id;
    }
    currentUserToken = (await sendLogin(mockedWS, "user_1")).response.user
      .token;
  });

  it("should work #1", async () => {
    console.log("<-- user_1 sent message (group) -->");
    let requestData = {
      request: {
        conversation_create: {
          name: "group conversations",
          description: "description group",
          type: "g",
          participants: [userId[1], userId[2], userId[0]],
        },
        id: "1",
      },
    };
    let responseData = await new ConversationController().create(
      mockedWS,
      requestData
    );
    currentConversationId =
      responseData.response.conversation.params._id.toString();

    requestData = {
      message: {
        id: "message1",
        body: "Hey! Group conversations",
        cid: currentConversationId,
      },
    };
    await new MessagesController().create(mockedWS, requestData);

    console.log("<-- user_1 sent message (private) -->");
    requestData = {
      message: {
        id: "message2",
        body: "Hey! Private conversations",
        to: userId[1],
      },
    };
    await new MessagesController().create(mockedWS, requestData);
    requestData = {
      message: {
        id: "message3",
        body: "Hey! Private conversations (second message)",
        to: userId[1],
      },
    };
    await new MessagesController().create(mockedWS, requestData);
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
    await new MessagesController().edit(mockedWS, requestData);

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
    await new MessagesController().delete(mockedWS, requestData);

    console.log("<-- user_3 go online -->");
    await sendLogin(mockedWS, "user_3");
  });

  after(async () => {
    await User.clearCollection();
    await UserSession.clearCollection();
    await OfflineQueue.clearCollection();
    // await Messages.clearCollection();
    await Conversation.clearCollection();
    await ConversationParticipant.clearCollection();
    userId = [];
  });
});
