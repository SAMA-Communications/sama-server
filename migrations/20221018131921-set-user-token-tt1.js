export const up = async (db, client) => {
  await db
    .collection("user_tokens")
    .createIndex({ updated_at: 1 }, { expireAfterSeconds: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRES_IN) })
  await db.collection("user_tokens").createIndex({ token: 1, device_id: 1 })
  await db.collection("user_tokens").createIndex({ user_id: 1, device_id: 1 })
}

export const down = async (db, client) => {
  await db.collection("user_tokens").dropIndex({ token: 1, device_id: 1 })
  await db.collection("user_tokens").dropIndex({ user_id: 1, device_id: 1 })
  await db.collection("user_tokens").dropIndex({ updated_at: 1 })
}
