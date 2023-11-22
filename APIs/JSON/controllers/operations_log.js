import BaseJSONController from "./base.js";
import OpLog from "@sama/models/operations_log.js";
import SessionRepository from "@sama/repositories/session_repository.js";
import { ACTIVE } from "@sama/store/session.js";

class OperationsLogController extends BaseJSONController {
  constructor() {
    super();
    this.sessionRepository = new SessionRepository(ACTIVE);
  }

  async logs(ws, data) {
    const {
      id: requestId,
      op_log_list: {
        created_at: { gt, lt },
      },
    } = data;

    let query = {
      user_id: this.sessionRepository.getSessionUserId(ws),
      created_at: gt ? { $gt: new Date(gt) } : { $lt: new Date(lt) },
    };

    const packets = await OpLog.findAll(query, ["user_id", "packet"]);
    return { response: { id: requestId, logs: packets } };
  }
}

export default new OperationsLogController();
