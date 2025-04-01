export const up = async (db, client) => {
  await db.collection("conversation_schemes").createIndex({ cid: 1 }, { unique: true })
}

export const down = async (db, client) => {
  await db.collection("conversation_scheme").dropIndex({ cid: 1 })
}
