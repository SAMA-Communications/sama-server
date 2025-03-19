export const up = async (db, client) => {
  await db.collection("messages").createIndex(
    { created_at: 1 },
    {
      partialFilterExpression: {
        encrypted_message_type: { $in: [0, 1] },
      },
      expireAfterSeconds: parseInt(process.env.ENCRYPTION_MESSAGE_EXPIRED_IN),
    }
  )
}

export const down = async (db, client) => {
  await db.collection("messages").dropIndex({ created_at: 1 })
}
