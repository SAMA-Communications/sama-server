export const up = async (db, client) => {
  await db.collection("encrypted_devices").createIndex({ identity_key: 1 }, { unique: true })
  await db.collection("encrypted_devices").createIndex({ signed_key: 1 }, { unique: true })
}

export const down = async (db, client) => {
  await db.collection("encrypted_devices").dropIndex({ identity_key: 1 })
  await db.collection("encrypted_devices").dropIndex({ signed_key: 1 })
}
