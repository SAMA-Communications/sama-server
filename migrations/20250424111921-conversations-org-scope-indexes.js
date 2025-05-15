export const up = async (db, client) => {
  await db.collection("conversations").dropIndex({ type: 1, owner_id: 1, opponent_id: 1 })
  await db.collection("conversations").dropIndex({ updated_at: 1 })

  await db.collection("conversations").createIndex({ organization_id: 1, type: 1, owner_id: 1, opponent_id: 1 })
  await db.collection("conversations").createIndex({ organization_id: 1, updated_at: 1 })
}

export const down = async (db, client) => {
  await db.collection("conversations").dropIndex({ organization_id: 1, type: 1, owner_id: 1, opponent_id: 1 })
  await db.collection("conversations").dropIndex({ organization_id: 1, updated_at: 1 })

  await db.collection("conversations").createIndex({ type: 1, owner_id: 1, opponent_id: 1 })
  await db.collection("conversations").createIndex({ updated_at: 1 })
}
