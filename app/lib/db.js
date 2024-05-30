import { MongoClient, ObjectId as OID } from "mongodb"

const client = new MongoClient(process.env.MONGODB_URL)

let dbConnection

export async function connectToDBPromise() {
  const db = await client.connect()

  const mongoURISplit = process.env.MONGODB_URL.split("/")
  const dbName = mongoURISplit[mongoURISplit.length - 1].split("?")[0]

  dbConnection = db.db(dbName)
}

export function getDb() {
  return dbConnection
}

export const ObjectId = OID
