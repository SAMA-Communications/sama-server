export const up = async (db, client) => {
  await db.collection("conversation_handlers").createIndex({ conversation_id: 1 }, { unique: true })
}

export const down = async (db, client) => {
  await db.collection("conversation_handlers").dropIndex({ conversation_id: 1 })
}
