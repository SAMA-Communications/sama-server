export const up = async (db, client) => {
  await db.collection("blocked_users").createIndex({ user_id: 1, blocked_user_id: 1 }, { unique: true })
}

export const down = async (db, client) => {
  await db.collection("blocked_users").dropIndex({ user_id: 1, blocked_user_id: 1 })
}
