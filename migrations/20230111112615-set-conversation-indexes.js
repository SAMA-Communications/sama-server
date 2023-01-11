export const up = async (db, client) => {
  await db.collection("conversations").createIndex({ owner_id: 1 });
  await db.collection("conversations").createIndex({ opponent_id: 1 });
  await db.collection("conversations").createIndex({ type: 1 });
};

export const down = async (db, client) => {
  await db.collection("conversations").dropIndexes();
};
