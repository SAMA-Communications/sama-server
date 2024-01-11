export const up = async (db, client) => {
  await db
    .collection("message_statuses")
    .createIndex({ cid: 1, mid: 1, user_id: 1 }, { unique: true });
  await db.collection("message_statuses").createIndex({ cid: 1, user_id: 1 });
};

export const down = async (db, client) => {
  await db
    .collection("message_statuses")
    .dropIndex({ cid: 1, mid: 1, user_id: 1 });
  await db.collection("message_statuses").dropIndex({ cid: 1, user_id: 1 });
};
