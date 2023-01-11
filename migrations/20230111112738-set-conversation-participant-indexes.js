export const up = async (db, client) => {
  await db
    .collection("conversations_participants")
    .createIndex({ user_id: 1, conversation_id: 1 });
};

export const down = async (db, client) => {
  await db
    .collection("conversations_participants")
    .dropIndex({ user_id: 1, conversation_id: 1 });
};
