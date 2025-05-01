import { hashPassword } from "../app/utils/crypto_utils.js"

export const up = async (db, client) => {
  await db.collection("conversation_handlers").createIndex({ conversation_id: 1 }, { unique: true })
  const existingBotUser = await db.collection("users").findOne({ login: "server-chat-bot" })
  if (!existingBotUser) {
    const { encryptedPassword, salt } = await hashPassword(process.env.CHAT_BOT_PASSWORD)
    await db.collection("users").insertOne({
      login: process.env.CHAT_BOT_LOGIN,
      first_name: "Chat",
      last_name: "Bot",
      password_salt: salt,
      encrypted_password: encryptedPassword,
      recent_activity: Math.round(Date.now() / 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }
}

export const down = async (db, client) => {
  await db.collection("conversation_handlers").dropIndex({ conversation_id: 1 })
}
