export const up = async (db, client) => {
  await db.collection('old_users').drop()
}

export const down = async (db, client) => {
  await db.createCollection('old_users')
}
