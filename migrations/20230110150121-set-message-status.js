export const up = async (db, client) => {
  await db
    .collection("message_status")
    .createIndex({ mid: 1 }, { unique: true });
  await db.collection("message_status").createIndex({ cid: 1 });
  await db.collection("message_status").createIndex({ user_id: 1 });
};

export const down = async (db, client) => {
  await db.collection("message_status").dropIndexes();
};
