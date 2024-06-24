export const up = async (db, client) => {
  await db.collection("message_status").createIndex({ mid: 1 }, { unique: true })
  await db.collection("message_status").createIndex({ cid: 1, user_id: 1 })
}

export const down = async (db, client) => {
  await db.collection("message_status").dropIndex({ mid: 1 })
  await db.collection("message_status").dropIndex({ cid: 1, user_id: 1 })
}
