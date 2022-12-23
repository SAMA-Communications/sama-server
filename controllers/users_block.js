import BlockedUser from "../models/blocked_user.js";
import validate, { validateIsUserId } from "../lib/validation.js";
import { getSessionUserId } from "../store/session.js";

export default class UserBlockController {
  async block(ws, data) {
    const requestId = data.request.id;
    const uId = data.request.block_user.id;
    const currentUserId = getSessionUserId(ws);
    await validate(ws, { uId }, [validateIsUserId]);

    const blockParams = {
      user_id: currentUserId,
      blocked_user_id: uId,
    };

    const isUserBlocked = await BlockedUser.findOne(blockParams);
    if (!isUserBlocked) {
      const blockedUser = new BlockedUser(blockParams);
      await blockedUser.save();
    }

    return { response: { id: requestId, success: true } };
  }

  async unblock(ws, data) {
    const requestId = data.request.id;
    const uId = data.request.unblock_user.id;
    const currentUserId = getSessionUserId(ws);
    await validate(ws, { uId }, [validateIsUserId]);

    const record = await BlockedUser.findOne({
      blocked_user_id: uId,
      user_id: currentUserId,
    });

    if (record) {
      await record.delete();
    }

    return { response: { id: requestId, success: true } };
  }

  async list(ws, data) {
    const requestId = data.request.id;
    const currentUserId = getSessionUserId(ws);

    const blockedUsers = await BlockedUser.findAll({ user_id: currentUserId }, [
      "blocked_user_id",
    ]);

    return {
      response: {
        id: requestId,
        users: blockedUsers.map((el) => el.blocked_user_id),
      },
    };
  }
}
