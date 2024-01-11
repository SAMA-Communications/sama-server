export const up = async (db, client) => {
  await db.collection("users").dropIndex({ login: 1 });
  await db
    .collection("users")
    .createIndex(
      { login: 1 },
      { unique: true, collation: { locale: "en", strength: 2 } }
    );
};

export const down = async (db, client) => {
  await db.collection("users").dropIndex({ login: 1 });
  await db.collection("users").createIndex({ login: 1 }, { unique: true });
};
