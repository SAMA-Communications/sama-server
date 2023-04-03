export const up = async (db, client) => {
  await db.collection("users").createIndex({ login: 1 }, { unique: true });
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("users").createIndex({ phone: 1 }, { unique: true });
  await db.collection("users").createIndex({ login: 1, updated_at: 1 });
};

export const down = async (db, client) => {
  await db.collection("users").dropIndex({ login: 1 });
  await db.collection("users").dropIndex({ email: 1 });
  await db.collection("users").dropIndex({ phone: 1 });
  await db.collection("users").dropIndex({ login: 1, updated_at: 1 });
};
