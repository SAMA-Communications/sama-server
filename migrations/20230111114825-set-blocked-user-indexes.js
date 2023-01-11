export const up = async (db, client) => {
  await db.collection("blocked_users").createIndex({ blocked_user_id: 1 });
  await db.collection("blocked_users").createIndex({ user_id: 1 });
};

export const down = async (db, client) => {
  await db.collection("blocked_users").dropIndexes();
};
