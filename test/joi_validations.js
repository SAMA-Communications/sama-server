import Conversation from "./../app/models/conversation.js";
import ConversationParticipant from "./../app/models/conversation_participant.js";
import SessionRepository from "./../app/repositories/session_repository.js";
import User from "./../app/models/user.js";
import assert from "assert";
import { connectToDBPromise } from "./../app/lib/db.js";
import {
  createConversation,
  createUserArray,
  sendLogin,
  sendLogout,
} from "./utils.js";

let currentUserToken = "";
let usersIds = [];

describe("Joi validations schema", async () => {
  before(async () => {
    await connectToDBPromise();
    usersIds = await createUserArray(3);
  });

  describe(" --> validateIsUserAccess", async () => {
    it("should work", async () => {});

    it("should fail", async () => {});
  });

  after(async () => {
    await User.clearCollection();
    await Conversation.clearCollection();
    await ConversationParticipant.clearCollection();
    await new SessionRepository().dropUserNodeDataBase();
  });
});
