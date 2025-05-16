import { MongoClient, ObjectId as OID } from "mongodb"

export async function connectToDBPromise(mongoUrl) {
  const client = new MongoClient(mongoUrl)
  const connection = await client.connect()

  const mongoURISplit = mongoUrl.split("/")
  const dbName = mongoURISplit[mongoURISplit.length - 1].split("?")[0]

  const dbConnection = connection.db(dbName)

  return dbConnection
}

export const ObjectId = OID
