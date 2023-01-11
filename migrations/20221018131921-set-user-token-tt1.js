export const up = async (db, client) => {
  await db
    .collection("user_token")
    .createIndex(
      { updated_at: 1 },
      { expireAfterSeconds: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN }
    );
};

export const down = async (db, client) => {
  await db.collection("user_token").dropIndex({ updated_at: 1 });
};
