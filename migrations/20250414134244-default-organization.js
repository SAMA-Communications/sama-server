const defaultOrganizationName = "default"

export const up = async (db, client) => {
  const defaultOrgParams = { name: defaultOrganizationName, updated_at: new Date(), created_at: new Date() }
  const { insertedId: defaultOrgId } = await db.collection("organizations").insertOne(defaultOrgParams)

  await db.collection("users").updateMany({}, { $set: { organization_id: defaultOrgId } })
  await db.collection("conversations").updateMany({}, { $set: { organization_id: defaultOrgId } })
  await db.collection("conversations_participants").updateMany({}, { $set: { organization_id: defaultOrgId } })
  await db.collection("messages").updateMany({}, { $set: { organization_id: defaultOrgId } })
  await db.collection("contacts").updateMany({}, { $set: { organization_id: defaultOrgId } })
  await db.collection("blocked_users").updateMany({}, { $set: { organization_id: defaultOrgId } })
  await db.collection("files").updateMany({}, { $set: { organization_id: defaultOrgId } })
  await db.collection("user_tokens").updateMany({}, { $set: { organization_id: defaultOrgId } })
  await db.collection("push_subscriptions").updateMany({}, { $set: { organization_id: defaultOrgId } })
}

export const down = async (db, client) => {
  await db.collection("users").updateMany({}, { $unset: { organization_id: true } })
  await db.collection("conversations").updateMany({}, { $unset: { organization_id: true } })
  await db.collection("conversations_participants").updateMany({}, { $unset: { organization_id: true } })
  await db.collection("messages").updateMany({}, { $unset: { organization_id: true } })
  await db.collection("contacts").updateMany({}, { $unset: { organization_id: true } })
  await db.collection("blocked_users").updateMany({}, { $unset: { organization_id: true } })
  await db.collection("files").updateMany({}, { $unset: { organization_id: true } })
  await db.collection("user_tokens").updateMany({}, { $unset: { organization_id: true } })
  await db.collection("push_subscriptions").updateMany({}, { $unset: { organization_id: true } })

  await db.collection("organizations").deleteOne({ name: defaultOrganizationName })
}
