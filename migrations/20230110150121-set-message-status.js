export const up = async (db, client) => {
  await db.collection("message_status").createIndex({ mid: 1 });
};

export const down = async (db, client) => {
  await db.collection("message_status").dropIndex({ mid: 1 });
};
