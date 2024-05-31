export const up = async (db, client) => {
  await db.collection("cluster_nodes").createIndex(
    { updated_at: 1 },
    {
      expireAfterSeconds: parseInt(process.env.NODE_CLUSTER_DATA_EXPIRES_IN) / 1000,
    }
  )
}

export const down = async (db, client) => {
  await db.collection("cluster_nodes").dropIndex({ updated_at: 1 })
}
