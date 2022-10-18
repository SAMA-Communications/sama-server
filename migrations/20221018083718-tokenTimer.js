export const up = async (db, client) => {
  await db
    .collection("user_token")
    .createIndex({ updated_at: 1 }, { expireAfterSeconds: 10800 });
};

export const down = async (db, client) => {};
