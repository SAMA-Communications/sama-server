import BlockedUser from "../models/blocked_user.js";
import BlockListRepository from "../repositories/blocklist_repository.js";
import validate, { validateIsUserId } from "../lib/validation.js";
import { getSessionUserId } from "../store/session.js";
import { inMemoryBlockList } from "../store/in_memory.js";

export default class UserBlockController {
  constructor() {
    this.blockListRepository = new BlockListRepository(
      BlockedUser,
      inMemoryBlockList
    );
  }

  async block(ws, data) {
    const requestId = data.request.id;
    const uId = data.request.block_user.id;
    const currentUserId = getSessionUserId(ws);
    await validate(ws, { uId }, [validateIsUserId]);

    this.blockListRepository.block(uId, currentUserId);

    return { response: { id: requestId, success: true } };
  }

  async unblock(ws, data) {
    const requestId = data.request.id;
    const uId = data.request.unblock_user.id;
    const currentUserId = getSessionUserId(ws);
    await validate(ws, { uId }, [validateIsUserId]);

    this.blockListRepository.unblock(uId, currentUserId);

    return { response: { id: requestId, success: true } };
  }

  async list(ws, data) {
    const requestId = data.request.id;
    const currentUserId = getSessionUserId(ws);

    const blockedUsersIds = await this.blockListRepository.findBlockedUserByUId(
      currentUserId
    );

    return {
      response: {
        id: requestId,
        users: blockedUsersIds,
      },
    };
  }
}
