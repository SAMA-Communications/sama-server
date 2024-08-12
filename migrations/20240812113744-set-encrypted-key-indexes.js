export const up = async (db, client) => {
  await db.collection("encryption").createIndex({ identity_key: 1 }, { unique: true })
  await db.collection("encryption").createIndex({ signed_key: 1 }, { unique: true })
}

export const down = async (db, client) => {
  await db.collection("encryption").dropIndex({ identity_key: 1 })
  await db.collection("encryption").dropIndex({ signed_key: 1 })
}
