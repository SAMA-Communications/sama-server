import Conversation from "../models/conversation.js";
import ConversationParticipant from "../models/conversation_participant.js";
import User from "../models/user.js";
import assert from "assert";
import { connectToDBPromise } from "../lib/db.js";
import { default as PacketProcessor } from "./../routes/delivery_manager.js";
import {
  createConversation,
  createUserArray,
  sendLogin,
  sendLogout,
} from "./utils.js";
import {
  validateConversationName,
  validateConversationType,
  validateConversationisUserOwner,
  validateIsConversation,
  validateIsConversationByCID,
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
  validateIsCID,
  validateIsUserSendHimSelf,
} from "../lib/validation.js";
import SessionRepository from "../repositories/session_repository.js";

let currentUserToken = "";
let usersIds = [];
let messageId = "";
let currentConversationId = "";

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
    usersIds = await createUserArray(3);
  });

  describe(" --> validateIsUserAccess", async () => {
    it("should work", async () => {
      currentUserToken = (await sendLogin("validate", "user_1")).response.user
        .token;
      const requestData = {
        name: "validate",
        from: usersIds[0],
      };
      assert.strictEqual(
        validateIsUserAccess(requestData, "validate"),
        undefined
      );
    });

    it("should fail", async () => {
      const requestData = {
        name: "validate",
        from: usersIds[1],
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

  describe(" --> validateIsCID", async () => {
    it("should work #2", async () => {
      const requestData = {
        cid: "chat",
      };
      assert.strictEqual(validateIsCID(requestData), undefined);
    });

    it("should fail", async () => {
      const requestData = {
        name: "chat",
      };
      assert.throws(
        () => {
          validateIsCID(requestData);
        },
        {
          name: "Error",
          message: "'cid' field is required",
          cause: {
            status: 422,
            message: "'cid' field is required",
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
        participants: [usersIds[0], usersIds[1]],
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
        owner_id: usersIds[0],
      };
      assert.strictEqual(
        validateConversationisUserOwner(requestData, "validate"),
        undefined
      );
    });

    it("should fail", async () => {
      const requestData = {
        owner_id: usersIds[1],
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

      currentConversationId = await createConversation(
        "validate",
        null,
        null,
        "g",
        [usersIds[1], usersIds[0]]
      );
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
        participants: [usersIds[0], usersIds[1]],
        opponent_id: usersIds[1],
      };
      assert.strictEqual(
        await validateParticipantsInUType(requestData),
        undefined
      );
    });

    it("should fail #1", async () => {
      const requestData = {
        participants: [usersIds[0], usersIds[1], "id3", "id4"],
        opponent_id: usersIds[1],
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
        participants: [usersIds[0], usersIds[1]],
      };
      await assertThrowsAsync(
        async () => {
          await validateParticipantsInUType(requestData);
        },
        {
          name: "Error",
          message: "Opponent Id not found",
          cause: { status: 422, message: "Opponent Id not found" },
        }
      );
    });
  });

  describe(" --> validateIsConversationByCID", async () => {
    before(async () => {
      currentUserToken = (await sendLogin("validate", "user_1")).response.user
        .token;
      currentConversationId = await createConversation(
        "validate",
        null,
        null,
        "g",
        [usersIds[2], usersIds[0]]
      );
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

  describe(" --> validateIsUserSendHimSelf", async () => {
    it("should work", async () => {
      currentUserToken = (await sendLogin("validate", "user_1")).response.token;
      const requestData = {
        opponent_id: usersIds[1],
      };
      assert.strictEqual(
        await validateIsUserSendHimSelf(requestData, "validate"),
        undefined
      );
    });

    it("should fail #1", async () => {
      const requestData = {
        opponent_id: usersIds[0],
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
        attachments: [],
      };

      assert.throws(() => validateMessageBody(requestData), {
        name: "Error",
        message: "Either message body or attachments required",
        cause: {
          status: 422,
          message: "Either message body or attachments required",
        },
      });
    });

    it("should fail #2", async () => {
      const requestData = {
        name: "123",
        attachments: [],
      };
      assert.throws(() => validateMessageBody(requestData), {
        name: "Error",
        message: "Either message body or attachments required",
        cause: {
          status: 422,
          message: "Either message body or attachments required",
        },
      });
    });
  });

  describe(" --> validateIsMessageById", async () => {
    before(async () => {
      currentUserToken = (await sendLogin("validate", "user_1")).response.user
        .token;

      currentConversationId = await createConversation(
        "validate",
        null,
        null,
        "g",
        [usersIds[1], usersIds[0]]
      );

      const requestData = {
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
      messageId = (
        await PacketProcessor.processJsonMessageOrError("validate", requestData)
      ).ask.server_mid;
    });

    after(async () => {
      await Conversation.clearCollection();
      await ConversationParticipant.clearCollection();
    });

    it("should work", async () => {
      const requestData = {
        mid: messageId,
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
    await Conversation.clearCollection();
    await ConversationParticipant.clearCollection();
    await new SessionRepository().dropUserNodeDataBase();
  });
});
