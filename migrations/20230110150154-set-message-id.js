export const up = async (db, client) => {
  await db.collection("messages").createIndex({ mid: 1 });
};

export const down = async (db, client) => {};
