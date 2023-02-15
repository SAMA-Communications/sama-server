import OpLog from "../models/operations_log.js";

function saveRequestInOpLog(user_id, packet) {
  const record = new OpLog({ user_id, packet });
  record.save();
}

export { saveRequestInOpLog };
