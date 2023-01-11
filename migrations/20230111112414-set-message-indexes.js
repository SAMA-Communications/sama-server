export const up = async (db, client) => {
  await db.collection("messages").createIndex({ _id: -1 });
  await db.collection("messages").createIndex({ cid: 1 });
  await db.collection("messages").createIndex({ updated_at: 1 });
};

export const down = async (db, client) => {
  await db.collection("messages").dropIndexes();
};
