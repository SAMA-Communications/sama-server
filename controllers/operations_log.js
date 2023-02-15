import OpLog from "../models/operations_log.js";
import validate, { valideteTimestampQueary } from "../lib/validation.js";
import { default as SessionRepository } from "../repositories/session_repository.js";

export default class OperationsLogController {
  async logs(ws, data) {
    const requestId = data.request.id;
    const { gt, lt } = data.request.user_logs;

    await validate(ws, { gt, lt }, [valideteTimestampQueary]);

    let query = { user_id: SessionRepository.getSessionUserId(ws) };
    gt
      ? (query.created_at = { $gt: new Date(gt) })
      : (query.created_at = { $lt: new Date(lt) });
    const logs = await OpLog.findAll(query, ["user_id", "packet"]);

    return { response: { id: requestId, logs: logs } };
  }
}
