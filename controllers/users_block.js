import { ERROR_STATUES } from "../constants/http_constants.js";
import validate, {
  validateIsConversationByCID,
  validateIsUserId,
} from "../lib/validation.js";
import BlockedUser from "../models/blocked_user.js";

export default class UserBlockController {
  async block(ws, data) {
    const requestId = data.request.id;
    const uId = data.request.id;
    const convId = data.request.cid;
    await validate(ws, { cid: convId, uId }, [
      validateIsConversationByCID,
      validateIsUserId,
    ]);

    const blockParams = {
      user_id: uId,
      conversation_id: convId,
    };

    const blockedUser = new BlockedUser(blockParams);
    await blockedUser.save();

    return {
      response: { id: requestId, blocked_user: blockedUser.visibleParams() },
    };
  }

  async unblock(ws, data) {
    const requestId = data.request.id;
    const uId = data.request.id;
    await validate(ws, { uId }, [validateIsUserId]);

    const record = await BlockedUser.findOne({ user_id: uId });
    if (record) {
      await record.delete();
      return { response: { id: requestId, success: true } };
    } else {
      throw new Error(ERROR_STATUES.USER_NOT_BLOCKED.message, {
        cause: ERROR_STATUES.USER_NOT_BLOCKED,
      });
    }
  }

  async list(ws, data) {
    const requestId = data.request.id;
    const convId = data.request.cid;
    await validate(ws, { cid: convId }, [validateIsConversationByCID]);

    const blockedUsers = await BlockedUser.findAll(
      { conversation_id: convId },
      ["user_id"]
    );

    return {
      response: { id: requestId, users: blockedUsers.map((el) => el.user_id) },
    };
  }
}
