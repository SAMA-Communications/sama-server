export const up = async (db, client) => {
  await db
    .collection("user_token")
    .createIndex(
      { updated_at: 1 },
      { expireAfterSeconds: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN }
    );
  await db.collection("user_token").createIndex({ token: 1 });
  await db.collection("user_token").createIndex({ user_id: 1 });
  await db.collection("user_token").createIndex({ device_id: 1 });
};

export const down = async (db, client) => {
  await db.collection("user_token").dropIndexes();
};
