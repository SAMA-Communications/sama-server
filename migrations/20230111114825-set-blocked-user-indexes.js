export const up = async (db, client) => {
  await db
    .collection("blocked_users")
    .createIndex({ blocked_user_id: 1, user_id: 1 });
};

export const down = async (db, client) => {
  await db
    .collection("blocked_users")
    .dropIndex({ blocked_user_id: 1, user_id: 1 });
};
