import OpLog from "../models/op_log.js";

function saveRequestInOpLog(user_id, request) {
  const record = new OpLog({ user_id, request });
  record.save();
}

export { saveRequestInOpLog };
