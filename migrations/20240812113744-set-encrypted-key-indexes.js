export const up = async (db, client) => {
  await db.collection("encrypted_devices").createIndex({ device_id: 1, user_id: 1, identity_key: 1 }, { unique: true })
}

export const down = async (db, client) => {
  await db.collection("encrypted_devices").dropIndex({ device_id: 1, user_id: 1, identity_key: 1 })
}
