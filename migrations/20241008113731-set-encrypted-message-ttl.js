export const up = async (db, client) => {
  await db
    .collection("messages")
    .createIndex({ expired_at: 1 }, { expireAfterSeconds: parseInt(process.env.ENCRYPTION_MESSAGE_EXPIRED_IN) })
}

export const down = async (db, client) => {
  await db.collection("messages").dropIndex({ expired_at: 1 })
}
