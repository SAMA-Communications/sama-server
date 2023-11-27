import BaseJSONController from "./base.js";
import SessionRepository from "@sama/repositories/session_repository.js";
import Status from "@sama/models/status.js";
import validate, { validateIsConversationByCID } from "@sama/lib/validation.js";
import { ACTIVE } from "@sama/store/session.js";
import packageManager from "@sama/networking/packet_manager.js";

class StatusesController extends BaseJSONController {
  constructor() {
    super();
    this.sessionRepository = new SessionRepository(ACTIVE);
  }

  async typing(ws, data) {
    const statusParams = data.typing;
    await validate(ws, { cid: statusParams.cid }, [
      validateIsConversationByCID,
    ]);
    statusParams.from = this.sessionRepository.getSessionUserId(ws);

    const status = new Status(statusParams);
    const currentTs = Math.round(Date.now() / 1000);
    status.params.t = parseInt(currentTs);

    await packageManager.deliverToUserOrUsers(ws, status, statusParams.cid);
  }
}

export default new StatusesController();
