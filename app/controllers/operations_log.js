import OpLog from "../models/operations_log.js";
import SessionRepository from "../repositories/session_repository.js";
import validate, { valideteTimestampQueary } from "../lib/validation.js";
import { ACTIVE } from "../store/session.js";

class OperationsLogController {
  constructor() {
    this.sessionRepository = new SessionRepository(ACTIVE);
  }

  async logs(ws, data) {
    const requestId = data.request.id;
    const { gt, lt } = data.request.op_log_list.created_at;
    await validate(ws, { gt, lt }, [valideteTimestampQueary]);

    let query = {
      user_id: this.sessionRepository.getSessionUserId(ws),
      created_at: gt ? { $gt: new Date(gt) } : { $lt: new Date(lt) },
    };

    const packets = await OpLog.findAll(query, ["user_id", "packet"]);
    console.log(packets);
    return { response: { id: requestId, logs: packets } };
  }
}

export default new OperationsLogController();
