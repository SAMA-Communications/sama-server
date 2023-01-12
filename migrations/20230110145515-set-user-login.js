export const up = async (db, client) => {
  await db.collection("users").createIndex({ login: 1, updated_at: 1 });
};

export const down = async (db, client) => {
  await db.collection("users").dropIndex({ login: 1, updated_at: 1 });
};
