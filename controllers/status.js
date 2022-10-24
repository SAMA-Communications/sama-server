import Status from "../models/status.js";
import validate, {
  validateStatusConversationType,
  validateIsConversationByCID,
  validateIsConversationByTO,
  validateIsMessageById,
  validateStatusId,
  validateTOorCID,
} from "../lib/validation.js";
import { ALLOW_FIELDS } from "../constants/fields_constants.js";
import { deliverToUserOrUsers } from "../routes/ws.js";
import { getSessionUserId } from "../models/active.js";
import { slice } from "../utils/req_res_utils.js";

export default class StatusController {
  async typing(ws, data) {
    const statusParams = slice(data.typing, ALLOW_FIELDS.ALLOWED_FILEDS_STATUS);
    await validate(ws, statusParams, [
      validateStatusId,
      validateStatusConversationType,
      validateTOorCID,
      statusParams.cid
        ? validateIsConversationByCID
        : validateIsConversationByTO,
    ]);
    statusParams.from = getSessionUserId(ws);

    const status = new Status(statusParams);
    const currentTs = Math.round(Date.now() / 1000);
    status.params.t = parseInt(currentTs);

    await deliverToUserOrUsers(statusParams, status, statusParams.from);
  }

  async read(ws, data) {
    const statusParams = slice(data.read, ALLOW_FIELDS.ALLOWED_FILEDS_STATUS);
    await validate(ws, statusParams, [
      validateStatusId,
      validateTOorCID,
      statusParams.cid
        ? validateIsConversationByCID
        : validateIsConversationByTO,
      validateIsMessageById,
    ]);
    statusParams.from = getSessionUserId(ws);

    const status = new Status(statusParams);
    const currentTs = Math.round(Date.now() / 1000);
    status.params.t = parseInt(currentTs);

    await deliverToUserOrUsers(statusParams, status, statusParams.from);
  }

  async delivered(ws, data) {
    const statusParams = slice(
      data.delivered,
      ALLOW_FIELDS.ALLOWED_FILEDS_STATUS
    );
    await validate(ws, statusParams, [
      validateStatusId,
      validateTOorCID,
      statusParams.cid
        ? validateIsConversationByCID
        : validateIsConversationByTO,
      validateIsMessageById,
    ]);
    statusParams.from = getSessionUserId(ws);

    const status = new Status(statusParams);
    const currentTs = Math.round(Date.now() / 1000);
    status.params.t = parseInt(currentTs);

    await deliverToUserOrUsers(statusParams, status, statusParams.from);
  }
}
