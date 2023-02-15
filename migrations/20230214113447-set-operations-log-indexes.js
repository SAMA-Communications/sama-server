export const up = async (db, client) => {
  await db.collection("operations_log").createIndex(
    { created_at: 1 },
    {
      expireAfterSeconds: parseInt(process.env.OPERATIONS_LOG_EXPIRES_IN),
    }
  );
  await db
    .collection("operations_log")
    .createIndex({ user_id: 1, created_at: 1 });
};

export const down = async (db, client) => {
  await db.collection("operations_log").dropIndex({ created_at: 1 });
  await db
    .collection("operations_log")
    .dropIndex({ user_id: 1, created_at: 1 });
};
