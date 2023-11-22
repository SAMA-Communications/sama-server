import BaseJSONController from "./base.js";
import BlockListRepository from "@sama/repositories/blocklist_repository.js";
import BlockedUser from "@sama/models/blocked_user.js";
import SessionRepository from "@sama/repositories/session_repository.js";
import { ACTIVE } from "@sama/store/session.js";
import { inMemoryBlockList } from "@sama/store/in_memory.js";

class UsersBlockController extends BaseJSONController {
  constructor() {
    super();
    this.blockListRepository = new BlockListRepository(
      BlockedUser,
      inMemoryBlockList
    );
    this.sessionRepository = new SessionRepository(ACTIVE);
  }

  //TODO: add multiply block users [id1, id2..] || [id1]
  async block(ws, data) {
    const {
      id: requestId,
      block_user: { id: uId },
    } = data;

    const currentUserId = this.sessionRepository.getSessionUserId(ws);
    await this.blockListRepository.block(uId, currentUserId);

    return { response: { id: requestId, success: true } };
  }

  async unblock(ws, data) {
    const {
      id: requestId,
      unblock_user: { id: uId },
    } = data;

    const currentUserId = this.sessionRepository.getSessionUserId(ws);
    await this.blockListRepository.unblock(uId, currentUserId);

    return { response: { id: requestId, success: true } };
  }

  async list(ws, data) {
    const { id: requestId } = data;

    const currentUserId = this.sessionRepository.getSessionUserId(ws);
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

export default new UsersBlockController();
