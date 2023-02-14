import OpLog from "../models/operations_log.js";

function saveRequestInOpLog(user_id, request) {
  const record = new OpLog({ user_id, request });
  record.save();
}

export { saveRequestInOpLog };
