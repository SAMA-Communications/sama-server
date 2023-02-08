import OfflineQueue from "../models/offline_queue.js";

function saveRequestInOfflineQueue(user_id, request) {
  const record = new OfflineQueue({ user_id, request });
  record.save();
}

export { saveRequestInOfflineQueue };
