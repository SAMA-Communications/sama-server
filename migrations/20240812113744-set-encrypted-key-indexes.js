export const up = async (db, client) => {
  await db.collection("encrypted_devices").createIndex({ user_id: 1, identity_key: 1 }, { unique: true })
}

export const down = async (db, client) => {
  await db.collection("encrypted_devices").dropIndex({ user_id: 1, identity_key: 1 })
}
