import SessionRepository from "../repositories/session_repository.js";
import Status from "../models/status.js";
import validate, {
  validateStatusConversationType,
  validateIsConversationByCID,
  validateStatusId,
  validateIsCID,
} from "../lib/validation.js";
import { ACTIVE } from "../store/session.js";
import { ALLOW_FIELDS } from "../constants/fields_constants.js";
import { default as PacketProcessor } from "../routes/delivery_manager.js";
import { slice } from "../utils/req_res_utils.js";

class StatusesController {
  constructor() {
    this.sessionRepository = new SessionRepository(ACTIVE);
  }

  async typing(ws, data) {
    const statusParams = slice(
      data.typing,
      ALLOW_FIELDS.ALLOWED_FILEDS_TYPINGS
    );
    await validate(ws, statusParams, [
      validateStatusId,
      validateStatusConversationType,
      validateIsCID,
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
