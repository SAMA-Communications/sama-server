export const up = async (db, client) => {
    await db.collection("organizations").createIndex({ name: 1 }, { unique: true })
  }
  
  export const down = async (db, client) => {
    await db.collection("organizations").dropIndex({ name: 1 })
  }
  