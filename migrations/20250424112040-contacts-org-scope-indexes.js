export const up = async (db, client) => {
    await db.collection("contacts").dropIndex({ "phone.value": 1, created_at: 1 })
    await db.collection("contacts").dropIndex({ "email.value": 1, created_at: 1 })
    await db.collection("contacts").dropIndex({ user_id: 1, updated_at: 1 })

    await db.collection("contacts").createIndex({ organization_id: 1, "phone.value": 1, created_at: 1 })
    await db.collection("contacts").createIndex({ organization_id: 1, "email.value": 1, created_at: 1 })
    await db.collection("contacts").createIndex({ organization_id: 1, user_id: 1, updated_at: 1 })
  }
  
  export const down = async (db, client) => {
    await db.collection("contacts").dropIndex({ organization_id: 1, "phone.value": 1, created_at: 1 })
    await db.collection("contacts").dropIndex({ organization_id: 1, "email.value": 1, created_at: 1 })
    await db.collection("contacts").dropIndex({ organization_id: 1, user_id: 1, updated_at: 1 })

    await db.collection("contacts").createIndex({ "phone.value": 1, created_at: 1 })
    await db.collection("contacts").createIndex({ "email.value": 1, created_at: 1 })
    await db.collection("contacts").createIndex({ user_id: 1, updated_at: 1 })
  }
  