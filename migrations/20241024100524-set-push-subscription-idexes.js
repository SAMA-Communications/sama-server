export const up = async (db, client) => {
  await db.collection("push_subscriptions").createIndex({ user_id: 1, device_udid: 1 })
  await db.collection("push_subscriptions").createIndex({ user_id: 1, platform: 1 })
}

export const down = async (db, client) => {
  await db.collection("push_subscriptions").dropIndex({ user_id: 1, device_udid: 1 })
  await db.collection("push_subscriptions").dropIndex({ user_id: 1, platform: 1 })
}
