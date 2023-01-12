export const up = async (db, client) => {
  await db.collection("offline_queue").createIndex({ user_id: 1 });
};

export const down = async (db, client) => {
  await db.collection("offline_queue").dropIndex({ user_id: 1 });
};
