export const up = async (db, client) => {
  await db.collection("users").createIndex({ _id: 1, login: 1 });
};

export const down = async (db, client) => {
  await db.collection("users").dropIndex({ _id: 1, login: 1 });
};
