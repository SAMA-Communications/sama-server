export const up = async (db, client) => {
  await db.collection("user_tokens").createIndex(
    { updated_at: 1 },
    {
      partialFilterExpression: { type: "otp" },
      expireAfterSeconds: +process.env.SERVICE_OTP_TOKEN_EXPIRES_IN,
      name: "created_at_otp_index",
    }
  )
}

export const down = async (db, client) => {
  await db.collection("user_tokens").dropIndex("created_at_otp_index")
}
