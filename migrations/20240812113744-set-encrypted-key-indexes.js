export const up = async (db, client) => {
  await db
    .collection("encrypted_devices")
    .createIndex({ updated_at: 1 }, { expireAfterSeconds: parseInt(process.env.ENCRYPTION_DEVICE_TOKEN_EXPIRES_IN) })
  await db.collection("encrypted_devices").createIndex({ user_id: 1, device_id: 1 }, { unique: true })
  await db.collection("encrypted_devices").createIndex({ device_id: 1 })
}

export const down = async (db, client) => {
  await db.collection("encrypted_devices").dropIndex({ user_id: 1, device_id: 1 })
  await db.collection("encrypted_devices").dropIndex({ device_id: 1 })
  await db.collection("encrypted_devices").dropIndex({ updated_at: 1 })
}
