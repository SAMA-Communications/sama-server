import { ObjectId } from "mongodb"

export const up = async (db, client) => {
  const org = await db.collection("organizations").findOne({ name: "default" })
  if (org && org._id !== "default") {
    await db.collection("organizations").deleteOne({ _id: org._id })
    await db.collection("organizations").insertOne({ ...org, _id: "default" })
  }
}

export const down = async (db, client) => {
  const org = await db.collection("organizations").findOne({ _id: "default" })
  if (org) {
    const { _id, ...rest } = org
    const newId = new ObjectId()
    await db.collection("organizations").deleteOne({ _id: "default" })
    await db.collection("organizations").insertOne({ ...rest, _id: newId })
  }
}
