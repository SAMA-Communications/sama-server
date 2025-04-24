export const up = async (db, client) => {
    await db.collection("users").dropIndex({ login: 1, updated_at: 1 })
    await db.collection("users").dropIndex({ login: 1 })
    await db.collection("users").dropIndex({ email: 1 })
    await db.collection("users").dropIndex({ phone: 1 })

    await db.collection("users").createIndex({ organization_id: 1, login: 1, updated_at: 1 }, { collation: { locale: "en", strength: 2 } })
    await db.collection("users").createIndex({ organization_id: 1, login: 1 }, { unique: true, collation: { locale: "en", strength: 2 } })
    await db.collection("users").createIndex({ organization_id: 1, email: 1 }, { unique: true, collation: { locale: "en", strength: 2 } })
    await db.collection("users").createIndex({ organization_id: 1, phone: 1 }, { unique: true, collation: { locale: "en", strength: 2 } })
  }
  
  export const down = async (db, client) => {
    await db.collection("users").dropIndex({ organization_id: 1, login: 1, updated_at: 1 })
    await db.collection("users").dropIndex({ organization_id: 1, login: 1 })
    await db.collection("users").dropIndex({ organization_id: 1, email: 1 })
    await db.collection("users").dropIndex({ organization_id: 1, phone: 1 })

    await db.collection("users").createIndex({ login: 1, updated_at: 1 }, { collation: { locale: "en", strength: 2 } })
    await db.collection("users").createIndex({ login: 1 }, { unique: true, collation: { locale: "en", strength: 2 } })
    await db.collection("users").createIndex({ email: 1 }, { unique: true, collation: { locale: "en", strength: 2 } })
    await db.collection("users").createIndex({ phone: 1 }, { unique: true, collation: { locale: "en", strength: 2 } })
  }
  