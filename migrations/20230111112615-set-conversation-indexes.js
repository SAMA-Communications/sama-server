export const up = async (db, client) => {
  await db
    .collection("conversations")
    .createIndex({ owner_id: 1, opponent_id: 1, type: 1 });
  await db.collection("conversations").createIndex({ updated_at: 1 });
};

export const down = async (db, client) => {
  await db
    .collection("conversations")
    .dropIndex({ owner_id: 1, opponent_id: 1, type: 1 });
  await db.collection("conversations").dropIndex({ updated_at: 1 });
};
