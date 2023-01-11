export const up = async (db, client) => {
  await db.collection("users").createIndex({ login: 1 }, { unique: true });
};

export const down = async (db, client) => {
  await db.collection("users").dropIndexes();
};
