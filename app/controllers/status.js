import SessionRepository from "../repositories/session_repository.js";
import Status from "../models/status.js";
import validate, { validateIsConversationByCID } from "../lib/validation.js";
import { ACTIVE } from "../store/session.js";
import { default as PacketProcessor } from "../routes/delivery_manager.js";

class StatusesController {
  constructor() {
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

    await PacketProcessor.deliverToUserOrUsers(ws, status, statusParams.cid);
  }
}

export default new StatusesController();
