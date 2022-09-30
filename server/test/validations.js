import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";
import User from "../models/user.js";
import UserSession from "../models/user_session.js";
import assert from "assert";
import { connectToDBPromise } from "../lib/db.js";
import { processJsonMessageOrError } from "../routes/ws.js";
import {
  validateConversationName,
  validateConversationType,
  validateConversationisUserOwner,
  validateIsConversation,
  validateIsConversationByCID,
  validateIsConversationByTO,
  validateIsMessageById,
  validateIsUserAccess,
  validateMessageBody,
  validateMessageDeleteType,
  validateMessageId,
  validateParticipants,
  validateParticipantsInUType,
  validateParticipantsLimit,
  validateStatusConversationType,
  validateStatusId,
  validateTOorCID,
  validateUserSession,
  validateIsUserSendHimSelf,
} from "../lib/validation.js";

let currentUserToken = "";
let userId = [];
let currentConversationId = "";

async function sendLogin(ws, login) {
  const requestData = {
    request: {
      user_login: {
        login: login,
        password: "user_paswword_1",
      },
      id: "0101",
    },
  };
  const response = await processJsonMessageOrError(ws, requestData);
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
  await processJsonMessageOrError("validate", requestData);
}

async function assertThrowsAsync(fn, regExp) {
  let f = () => {};
  try {
    await fn();
  } catch (e) {
    f = () => {
      throw e;
    };
  } finally {
    assert.throws(f, regExp);
  }
}

describe("Validate functions", async () => {
  before(async () => {
    await connectToDBPromise();
    for (let i = 0; i < 3; i++) {
      const requestDataCreate = {
        request: {
          user_create: {
            login: `user_${i + 1}`,
            password: "user_paswword_1",
          },
          id: "0",
        },
      };
      const responseData = await processJsonMessageOrError(
        "validate",
        requestDataCreate
      );
      userId[i] = JSON.parse(responseData.response.user)._id;
    }
  });

  describe(" --> validateIsUserAccess", async () => {
    it("should work", async () => {
      currentUserToken = (await sendLogin("validate", "user_1")).response.user
        .token;
      const requestData = {
        name: "validate",
        from: userId[0],
      };
      assert.strictEqual(
        validateIsUserAccess(requestData, "validate"),
        undefined
      );
    });

    it("should fail", async () => {
      const requestData = {
        name: "validate",
        from: userId[1],
      };
      assert.throws(
        () => {
          validateIsUserAccess(requestData, "validate");
        },
        {
          name: "Error",
          message: "Forbidden",
          cause: { status: 403, message: "Forbidden" },
        }
      );
      await sendLogout("validate", currentUserToken);
    });
  });

  describe(" --> validateUserSession", async () => {
    it("should work", async () => {
      currentUserToken = (await sendLogin("validate", "user_1")).response.user
        .token;
      assert.strictEqual(validateUserSession(null, "validate"), undefined);
    });

    it("should fail", async () => {
      await sendLogout("validate", currentUserToken);
      assert.throws(
        () => {
          validateUserSession(null, "validate");
        },
        {
          name: "Error",
          message: "Unauthorized",
          cause: { status: 404, message: "Unauthorized" },
        }
      );
    });
  });

  describe(" --> validateTOorCID", async () => {
    it("should work #1", async () => {
      const requestData = {
        to: "chat",
      };
      assert.strictEqual(validateTOorCID(requestData), undefined);
    });

    it("should work #2", async () => {
      const requestData = {
        cid: "chat",
      };
      assert.strictEqual(validateTOorCID(requestData), undefined);
    });

    it("should fail", async () => {
      const requestData = {
        name: "chat",
      };
      assert.throws(
        () => {
          validateTOorCID(requestData);
        },
        {
          name: "Error",
          message: "Either 'to' or 'cid' field is required",
          cause: {
            status: 422,
            message: "Either 'to' or 'cid' field is required",
          },
        }
      );
    });
  });

  describe(" --> validateConversationType", async () => {
    it("should work #1", async () => {
      const requestData = {
        name: "chat",
        type: "g",
      };
      assert.strictEqual(validateConversationType(requestData), undefined);
    });

    it("should work #2", async () => {
      const requestData = {
        name: "chat",
        type: "u",
      };
      assert.strictEqual(validateConversationType(requestData), undefined);
    });

    it("should fail #1", async () => {
      const requestData = {
        name: "chat",
      };
      assert.throws(
        () => {
          validateConversationType(requestData);
        },
        {
          name: "Error",
          message: "Conversation Type missed",
          cause: {
            status: 422,
            message: "Conversation Type missed",
          },
        }
      );
    });

    it("should fail #2", async () => {
      const requestData = {
        name: "chat",
        type: "gsafddsvsd",
      };
      assert.throws(
        () => {
          validateConversationType(requestData);
        },
        {
          name: "Error",
          message: "Incorrect type",
          cause: {
            status: 422,
            message: "Incorrect type",
          },
        }
      );
    });
  });

  describe(" --> validateParticipants", async () => {
    it("should work", async () => {
      const requestData = {
        name: "chat",
        participants: [userId[0], userId[1]],
        type: "g",
      };
      assert.strictEqual(validateParticipants(requestData), undefined);
    });

    it("should fail", async () => {
      const requestData = {
        name: "validate",
        type: "g",
      };
      assert.throws(
        () => {
          validateParticipants(requestData);
        },
        {
          name: "Error",
          message: "Select at least one user",
          cause: { status: 422, message: "Select at least one user" },
        }
      );
    });

    it("should fail", async () => {
      const requestData = {
        name: "validate",
        participants: [],
        type: "g",
      };
      assert.throws(
        () => {
          validateParticipants(requestData);
        },
        {
          name: "Error",
          message: "Select at least one user",
          cause: { status: 422, message: "Select at least one user" },
        }
      );
    });
  });

  describe(" --> validateConversationName", async () => {
    it("should work", async () => {
      const requestData = {
        name: "chat",
        type: "g",
      };
      assert.strictEqual(validateConversationName(requestData), undefined);
    });

    it("should fail", async () => {
      const requestData = {
        type: "g",
      };
      assert.throws(
        () => {
          validateConversationName(requestData);
        },
        {
          name: "Error",
          message: "No conversation name specified",
          cause: {
            status: 422,
            message: "No conversation name specified",
          },
        }
      );
    });
  });

  describe(" --> validateConversationisUserOwner", async () => {
    it("should work", async () => {
      currentUserToken = (await sendLogin("validate", "user_1")).response.user
        .token;
      const requestData = {
        name: "chat",
        owner_id: userId[0],
      };
      assert.strictEqual(
        validateConversationisUserOwner(requestData, "validate"),
        undefined
      );
    });

    it("should fail", async () => {
      const requestData = {
        owner_id: userId[1],
      };
      assert.throws(
        () => {
          validateConversationisUserOwner(requestData, "validate");
        },
        {
          name: "Error",
          message: "Forbidden",
          cause: { status: 403, message: "Forbidden" },
        }
      );
      await sendLogout("validate", currentUserToken);
    });
  });

  describe(" --> validateIsConversation", async () => {
    before(async () => {
      currentUserToken = (await sendLogin("validate", "user_1")).response.user
        .token;
      const requestData = {
        request: {
          conversation_create: {
            name: "validate",
            description: "for admin and user",
            type: "g",
            participants: [userId[0], userId[1]],
          },
          id: "1_5",
        },
      };
      const responseData = await processJsonMessageOrError(
        "validate",
        requestData
      );
      currentConversationId =
        responseData.response.conversation.params._id.toString();
    });

    after(async () => {
      await Conversation.clearCollection();
      await ConversationParticipant.clearCollection();
    });

    it("should work", async () => {
      const requestData = {
        id: currentConversationId,
      };
      assert.strictEqual(await validateIsConversation(requestData), undefined);
    });

    it("should fail #1", async () => {
      const requestData = {
        name: "sad",
      };
      await assertThrowsAsync(
        async () => {
          await validateIsConversation(requestData);
        },
        {
          name: "Error",
          message: "Bad Request",
          cause: { status: 400, message: "Bad Request" },
        }
      );
    });

    it("should fail #2", async () => {
      const requestData = {
        id: "currentConversationId",
      };
      await assertThrowsAsync(
        async () => {
          await validateIsConversation(requestData);
        },
        {
          name: "Error",
          message: "Bad Request",
          cause: { status: 400, message: "Bad Request" },
        }
      );
      await sendLogout("validate", currentUserToken);
    });
  });

  describe(" --> validateParticipantsLimit", async () => {
    it("should work", async () => {
      const requestData = 12;
      assert.strictEqual(validateParticipantsLimit(requestData), undefined);
    });

    it("should fail", async () => {
      const requestData = 55;
      assert.throws(
        () => {
          validateParticipantsLimit(requestData);
        },
        {
          name: "Error",
          message: "Max participants limit reached",
          cause: {
            status: 422,
            message: "Max participants limit reached",
          },
        }
      );
    });
  });

  describe(" --> validateParticipantsInUType", async () => {
    it("should work", async () => {
      const requestData = {
        participants: [userId[0], userId[1]],
        recipient: userId[1],
      };
      assert.strictEqual(
        await validateParticipantsInUType(requestData),
        undefined
      );
    });

    it("should fail #1", async () => {
      const requestData = {
        participants: [userId[0], userId[1], "id3", "id4"],
        recipient: userId[1],
      };
      await assertThrowsAsync(
        async () => {
          await validateParticipantsInUType(requestData);
        },
        {
          name: "Error",
          message: "Too many users in private conversation",
          cause: {
            status: 422,
            message: "Too many users in private conversation",
          },
        }
      );
    });

    it("should fail #2", async () => {
      const requestData = {
        participants: [userId[0], userId[1]],
      };
      await assertThrowsAsync(
        async () => {
          await validateParticipantsInUType(requestData);
        },
        {
          name: "Error",
          message: "Recipient not found",
          cause: { status: 422, message: "Recipient not found" },
        }
      );
    });
  });

  describe(" --> validateIsConversationByCID", async () => {
    before(async () => {
      currentUserToken = (await sendLogin("validate", "user_1")).response.user
        .token;
      let requestData = {
        request: {
          conversation_create: {
            name: "validate",
            description: "for admin and user",
            type: "g",
            participants: [userId[0], userId[2]],
          },
          id: "1_5",
        },
      };
      const responseData = await processJsonMessageOrError(
        "validate",
        requestData
      );

      currentConversationId =
        responseData.response.conversation.params._id.toString();
    });

    it("should work", async () => {
      const requestData = {
        cid: currentConversationId,
      };
      assert.strictEqual(
        await validateIsConversationByCID(requestData, "validate"),
        undefined
      );
      await sendLogout("validate", currentUserToken);
    });

    it("should fail #1", async () => {
      currentUserToken = (await sendLogin("validate", "user_2")).response.user
        .token;
      const requestData = {
        cid: currentConversationId,
      };
      await assertThrowsAsync(
        async () => {
          await validateIsConversationByCID(requestData, "validate");
        },
        {
          name: "Error",
          message: "Forbidden",
          cause: { status: 403, message: "Forbidden" },
        }
      );
      await sendLogout("validate", currentUserToken);
    });

    it("should fail #2", async () => {
      const requestData = {
        cid: "asd",
      };
      await assertThrowsAsync(
        async () => {
          await validateIsConversationByCID(requestData, "validate");
        },
        {
          name: "Error",
          message: "Conversation not found",
          cause: { status: 404, message: "Conversation not found" },
        }
      );
    });

    it("should fail #3", async () => {
      const requestData = {
        name: "123",
      };
      await assertThrowsAsync(
        async () => {
          await validateIsConversationByCID(requestData, "validate");
        },
        {
          name: "Error",
          message: "Conversation not found",
          cause: { status: 404, message: "Conversation not found" },
        }
      );
      await sendLogout("validate", currentUserToken);
    });

    after(async () => {
      await Conversation.clearCollection();
      await ConversationParticipant.clearCollection();
    });
  });

  describe(" --> validateIsConversationByTO", async () => {
    before(async () => {
      currentUserToken = (await sendLogin("validate", "user_1")).response.user
        .token;
      let requestData = {
        request: {
          conversation_create: {
            description: "for admin and user",
            type: "u",
            participants: [userId[0], userId[1]],
            recipient: userId[1],
          },
          id: "1_5",
        },
      };
      const responseData = await processJsonMessageOrError(
        "validate",
        requestData
      );
    });

    it("should work", async () => {
      const requestData = {
        to: userId[1],
      };
      assert.strictEqual(
        await validateIsConversationByTO(requestData, "validate"),
        undefined
      );
      await sendLogout("validate", currentUserToken);
    });

    it("should fail #1", async () => {
      const requestData = {
        to: userId[1],
      };
      await assertThrowsAsync(
        async () => {
          await validateIsConversationByTO(requestData, "validate");
        },
        {
          name: "Error",
          message: "Conversation not found",
          cause: { status: 404, message: "Conversation not found" },
        }
      );
    });

    after(async () => {
      await Conversation.clearCollection();
      await ConversationParticipant.clearCollection();
    });
  });

  describe(" --> validateIsUserSendHimSelf", async () => {
    it("should work", async () => {
      currentUserToken = (await sendLogin("validate", "user_1")).response.user
        .token;
      const requestData = {
        recipient: userId[1],
      };
      assert.strictEqual(
        await validateIsUserSendHimSelf(requestData, "validate"),
        undefined
      );
    });

    it("should fail #1", async () => {
      const requestData = {
        recipient: userId[0],
      };
      await assertThrowsAsync(
        async () => {
          await validateIsUserSendHimSelf(requestData, "validate");
        },
        {
          name: "Error",
          message: "Incorrect user",
          cause: { status: 422, message: "Incorrect user" },
        }
      );
      await sendLogout("validate", currentUserToken);
    });
  });

  describe(" --> validateMessageId", async () => {
    it("should work", async () => {
      const requestData = {
        id: "xyz",
      };
      assert.strictEqual(validateMessageId(requestData), undefined);
    });

    it("should fail #1", async () => {
      const requestData = {
        id: "",
      };
      assert.throws(
        () => {
          validateMessageId(requestData);
        },
        {
          name: "Error",
          message: "Message ID missed",
          cause: { status: 422, message: "Message ID missed" },
        }
      );
    });

    it("should fail #2", async () => {
      const requestData = {
        name: "xyz",
      };
      assert.throws(
        () => {
          validateMessageId(requestData);
        },
        {
          name: "Error",
          message: "Message ID missed",
          cause: { status: 422, message: "Message ID missed" },
        }
      );
    });
  });

  describe(" --> validateMessageBody", async () => {
    it("should work", async () => {
      const requestData = {
        body: "xyz",
      };
      assert.strictEqual(validateMessageBody(requestData), undefined);
    });

    it("should fail #1", async () => {
      const requestData = {
        body: "",
      };
      assert.throws(
        () => {
          validateMessageBody(requestData);
        },
        {
          name: "Error",
          message: "Body of message is empty",
          cause: { status: 422, message: "Body of message is empty" },
        }
      );
    });

    it("should fail #2", async () => {
      const requestData = {
        name: "123",
      };
      assert.throws(
        () => {
          validateMessageBody(requestData);
        },
        {
          name: "Error",
          message: "Body of message is empty",
          cause: { status: 422, message: "Body of message is empty" },
        }
      );
    });
  });

  describe(" --> validateIsMessageById", async () => {
    before(async () => {
      currentUserToken = (await sendLogin("validate", "user_1")).response.user
        .token;
      let requestData = {
        request: {
          conversation_create: {
            name: "validate",
            description: "for admin and user",
            type: "g",
            participants: [userId[0], userId[1]],
          },
          id: "1_5",
        },
      };
      const responseData = await processJsonMessageOrError(
        "validate",
        requestData
      );
      currentConversationId =
        responseData.response.conversation.params._id.toString();
      requestData = {
        message: {
          id: "xyz",
          body: "hey how is going?",
          cid: currentConversationId,
          x: {
            param1: "value",
            param2: "value",
          },
        },
      };
      await processJsonMessageOrError("validate", requestData);
    });

    after(async () => {
      await Conversation.clearCollection();
      await ConversationParticipant.clearCollection();
    });

    it("should work", async () => {
      const requestData = {
        mid: "xyz",
      };
      assert.strictEqual(await validateIsMessageById(requestData), undefined);
    });

    it("should fail #1", async () => {
      const requestData = {
        mid: "asd",
      };
      await assertThrowsAsync(
        async () => {
          await validateIsMessageById(requestData);
        },
        {
          name: "Error",
          message: "Message ID not found",
          cause: { status: 422, message: "Message ID not found" },
        }
      );
    });

    it("should fail #2", async () => {
      const requestData = {
        name: "123",
      };
      await assertThrowsAsync(
        async () => {
          await validateIsMessageById(requestData);
        },
        {
          name: "Error",
          message: "Message ID missed",
          cause: { status: 422, message: "Message ID missed" },
        }
      );
      await sendLogout("validate", currentUserToken);
    });
  });

  describe(" --> validateMessageDeleteType", async () => {
    it("should work #1", async () => {
      const requestData = {
        name: "chat",
        type: "all",
      };
      assert.strictEqual(validateMessageDeleteType(requestData), undefined);
    });

    it("should work #2", async () => {
      const requestData = {
        name: "chat",
        type: "me",
      };
      assert.strictEqual(validateMessageDeleteType(requestData), undefined);
    });

    it("should fail #1", async () => {
      const requestData = {
        name: "chat",
      };
      assert.throws(
        () => {
          validateMessageDeleteType(requestData);
        },
        {
          name: "Error",
          message: "Message Type missed",
          cause: { status: 422, message: "Message Type missed" },
        }
      );
    });

    it("should fail #2", async () => {
      const requestData = {
        name: "chat",
        type: "asdfsd",
      };
      assert.throws(
        () => {
          validateMessageDeleteType(requestData);
        },
        {
          name: "Error",
          message: "Incorrect type",
          cause: {
            status: 422,
            message: "Incorrect type",
          },
        }
      );
    });
  });

  describe(" --> validateStatusId", async () => {
    it("should work", async () => {
      const requestData = {
        id: "chat",
      };
      assert.strictEqual(validateStatusId(requestData), undefined);
    });

    it("should fail", async () => {
      const requestData = {
        name: "g",
      };
      assert.throws(
        () => {
          validateStatusId(requestData);
        },
        {
          name: "Error",
          message: "Status ID missed",
          cause: { status: 422, message: "Status ID missed" },
        }
      );
    });
  });

  describe(" --> validateStatusConversationType", async () => {
    it("should work #1", async () => {
      const requestData = {
        name: "chat",
        type: "start",
      };
      assert.strictEqual(
        validateStatusConversationType(requestData),
        undefined
      );
    });

    it("should work #2", async () => {
      const requestData = {
        name: "chat",
        type: "stop",
      };
      assert.strictEqual(
        validateStatusConversationType(requestData),
        undefined
      );
    });

    it("should fail #1", async () => {
      const requestData = {
        name: "chat",
      };
      assert.throws(
        () => {
          validateStatusConversationType(requestData);
        },
        {
          name: "Error",
          message: "Status Type missed",
          cause: { status: 422, message: "Status Type missed" },
        }
      );
    });

    it("should fail #2", async () => {
      const requestData = {
        name: "chat",
        type: "asdfsd",
      };
      assert.throws(
        () => {
          validateStatusConversationType(requestData);
        },
        {
          name: "Error",
          message: "Incorrect type",
          cause: {
            status: 422,
            message: "Incorrect type",
          },
        }
      );
    });
  });
  after(async () => {
    await User.clearCollection();
    await UserSession.clearCollection();
    await Conversation.clearCollection();
    await ConversationParticipant.clearCollection();
  });
});
