export const up = async (db, client) => {
  await db.collection("user_tokens").dropIndex({ updated_at: 1 })
  await db.collection("user_tokens").createIndex(
    { updated_at: 1 },
    {
      partialFilterExpression: { type: "access" },
      expireAfterSeconds: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRES_IN),
      name: "created_at_access_index",
    }
  )
  await db.collection("user_tokens").createIndex(
    { updated_at: 1 },
    {
      partialFilterExpression: { type: "refresh" },
      expireAfterSeconds: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRES_IN),
      name: "created_at_refresh_index",
    }
  )
}

export const down = async (db, client) => {
  await db.collection("user_tokens").dropIndex("created_at_access_index")
  await db.collection("user_tokens").dropIndex("created_at_refresh_index")
  await db
    .collection("user_tokens")
    .createIndex({ updated_at: 1 }, { expireAfterSeconds: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRES_IN) })
}
