import Status from "../models/status.js";
import validate, {
  validateStatusConversationType,
  validateIsConversationByCID,
  validateStatusId,
  validateIsCID,
} from "../lib/validation.js";
import { ALLOW_FIELDS } from "../constants/fields_constants.js";
import { deliverToUserOrUsers } from "../routes/ws.js";
import { getSessionUserId } from "../store/session.js";
import { slice } from "../utils/req_res_utils.js";

export default class StatusController {
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
    statusParams.from = getSessionUserId(ws);

    const status = new Status(statusParams);
    const currentTs = Math.round(Date.now() / 1000);
    status.params.t = parseInt(currentTs);

    await deliverToUserOrUsers(statusParams, status, statusParams.from);
  }
}
