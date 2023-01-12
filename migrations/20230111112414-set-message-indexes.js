export const up = async (db, client) => {
  await db.collection("messages").createIndex({ cid: 1, updated_at: 1 });
  await db.collection("messages").createIndex({ cid: 1, t: -1 });
};

export const down = async (db, client) => {
  await db.collection("messages").dropIndex({ cid: 1, updated_at: 1 });
  await db.collection("messages").dropIndex({ cid: 1, t: -1 });
};
