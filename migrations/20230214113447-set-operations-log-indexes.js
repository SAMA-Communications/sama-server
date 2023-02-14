export const up = async (db, client) => {
  await db.collection("operations_log").createIndex(
    { created_at: 1 },
    {
      expireAfterSeconds: parseInt(process.env.OPERATIONS_LOG_TOKEN_EXPIRES_IN),
    }
  );
};

export const down = async (db, client) => {
  await db.collection("operations_log").dropIndex({ created_at: 1 });
};
