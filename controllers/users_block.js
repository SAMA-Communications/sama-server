import validate, {
  validateIsConversationByCID,
  validateIsUserId,
} from "../lib/validation.js";
import BlockedUser from "../models/blocked_user.js";

export default class UserBlockController {
  async block(ws, data) {
    const requestId = data.request.id;
    const uId = data.request.user_id;
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
    return { response: { id: requestId, success: true } };
  }

  async list(ws, data) {
    const requestId = data.request.id;
    return { response: { id: requestId, users: [] } };
  }
}
