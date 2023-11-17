import BaseJSONController from "./base.js";
import SessionRepository from "../../../app/repositories/session_repository.js";
import Status from "../../../app/models/status.js";
import validate, { validateIsConversationByCID } from "../../../app/lib/validation.js";
import { ACTIVE } from "../../../app/store/session.js";
import packageManager from "../../../app/routes/packet_manager.js";

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
