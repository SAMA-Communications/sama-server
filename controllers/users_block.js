import BlockListRepository from "../repositories/blocklist_repository.js";
import BlockedUser from "../models/blocked_user.js";
import SessionController from "../repositories/session_repository.js";
import validate, { validateIsUserId } from "../lib/validation.js";
import { inMemoryBlockList } from "../store/in_memory.js";

export default class UsersBlockController {
  constructor() {
    this.blockListRepository = new BlockListRepository(
      BlockedUser,
      inMemoryBlockList
    );
  }

  async block(ws, data) {
    const requestId = data.request.id;
    const uId = data.request.block_user.id;
    const currentUserId = SessionController.getSessionUserId(ws);
    await validate(ws, { uId }, [validateIsUserId]);

    this.blockListRepository.block(uId, currentUserId);

    return { response: { id: requestId, success: true } };
  }

  async unblock(ws, data) {
    const requestId = data.request.id;
    const uId = data.request.unblock_user.id;
    const currentUserId = SessionController.getSessionUserId(ws);
    await validate(ws, { uId }, [validateIsUserId]);

    this.blockListRepository.unblock(uId, currentUserId);

    return { response: { id: requestId, success: true } };
  }

  async list(ws, data) {
    const requestId = data.request.id;
    const currentUserId = SessionController.getSessionUserId(ws);

    const blockedUsersIds = await this.blockListRepository.getBlockList(
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
