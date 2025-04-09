export const up = async (db, client) => {
  await db.collection("conversation_schemes").createIndex({ conversation_id: 1 }, { unique: true })
}

export const down = async (db, client) => {
  await db.collection("conversation_schemes").dropIndex({ conversation_id: 1 })
}
