export const up = async (db, client) => {
  await db.collection("messages").createIndex({ _id: -1 });
  await db.collection("messages").createIndex({ cid: 1, updated_at: 1 });
  await db.collection("messages").createIndex({ cid: 1, from: 1 });
  await db.collection("messages").createIndex({ cid: 1, deleted_for: 1 });
};

export const down = async (db, client) => {
  await db.collection("messages").dropIndex({ cid: 1, updated_at: 1 });
  await db.collection("messages").dropIndex({ cid: 1, from: 1 });
  await db.collection("messages").dropIndex({ cid: 1, deleted_for: 1 });
};
