export const up = async (db, client) => {
    await db.collection("message_reactions").createIndex({ mid: 1, user_id: 1, reaction: 1 })
  }
  
  export const down = async (db, client) => {
    await db.collection("message_reactions").dropIndex({ mid: 1, user_id: 1, reaction: 1 })
  }
  