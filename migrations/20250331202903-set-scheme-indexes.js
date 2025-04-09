export const up = async (db, client) => {
  await db.collection("conversation_schemes").createIndex({ cid: 1 }, { unique: true })
}

export const down = async (db, client) => {
  await db.collection("conversation_schemes").dropIndex({ cid: 1 })
}
