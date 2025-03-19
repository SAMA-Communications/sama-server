export const up = async (db, client) => {
  await db.collection("encrypted_message_statuses").createIndex({ mid: 1 }, { uniqe: true })
  await db
    .collection("encrypted_message_statuses")
    .createIndex({ created_at: 1 }, { expireAfterSeconds: parseInt(process.env.ENCRYPTION_MESSAGE_EXPIRED_IN) })
}

export const down = async (db, client) => {
  await db.collection("encrypted_message_statuses").dropIndex({ mid: 1 })
  await db.collection("encrypted_message_statuses").dropIndex({ created_at: 1 })
}
