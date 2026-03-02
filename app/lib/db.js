import { MongoClient, ObjectId as OID } from "mongodb"
import config from "../config/index.js"

export async function connectToDBPromise(mongoUrl) {
  const client = new MongoClient(mongoUrl, { monitorCommands: true })

  if (config.get("db.mongo.logQueries")) {
    client.on("commandStarted", onMongoCommandListener)
  }

  const connection = await client.connect()

  const mongoURISplit = mongoUrl.split("/")
  const dbName = mongoURISplit[mongoURISplit.length - 1].split("?")[0]

  const dbConnection = connection.db(dbName)

  return dbConnection
}

const uniqueQueries = new Map()

const buildQueryPatter = (query) => {
  let queryPatter = ""

  const fieldsNames = Object.entries(query).map(([field, val]) => {
    const fieldName = field
    let operators = ""

    if (typeof val === "object" && !(val instanceof OID)) {
      operators = Object.keys(val).sort().join("|")
    }

    return operators ? [fieldName, operators].join("|") : fieldName
  })

  queryPatter = fieldsNames.sort().join(", ")

  return queryPatter
}

const onMongoCommandListener = (event) => {
  const dbName = event.databaseName
  const operationType = event.commandName
  const collectionName = event.command[operationType]

  delete event.command[operationType]
  delete event.command.$db
  delete event.command.lsid

  if (event.command) {
    console.log(
      `[Mongo command][${event.requestId}][${dbName}][${collectionName}][${operationType}]`,
      JSON.stringify(event.command, null, 5)
    )
  } else {
    return
  }

  let queryPatterBase = `COL=(${collectionName}) OP=${operationType}`
  let queryPatter = ""

  if (operationType === "find") {
    queryPatter = buildQueryPatter(event.command.filter)
  } else if (operationType === "delete") {
    queryPatter = buildQueryPatter(event.command.deletes.at(0)?.q ?? {})
  } else if (operationType === "update") {
    queryPatter = buildQueryPatter(event.command.updates.at(0)?.q ?? {})
  } else if (operationType === "findAndModify") {
    queryPatter = buildQueryPatter(event.command.query)
  } else if (operationType === "count") {
    queryPatter = buildQueryPatter(event.command.query)
  } else if (operationType === "aggregate") {
    queryPatter = buildQueryPatter(event.command.pipeline.at(0)?.["$match"] ?? {})
  } else if (operationType === "insert") {
    // console.log(`[Mongo command][${dbName}][${operationType}][${collectionName}][insert]`, event.command)
    return
  } else {
    queryPatter = "UNKNOWN"
    console.log(`[Mongo command][unknown]`)
  }

  queryPatterBase = `${queryPatterBase} % Q=(${queryPatter}) %`
  if (operationType === "find") {
    const sortParams = event.command.sort ? JSON.stringify(Array.from(event.command.sort)) : ""
    queryPatterBase = `${queryPatterBase} limit=(${event.command.limit}) sort=(${sortParams}`
  }

  uniqueQueries.set(queryPatterBase, event.requestId)
}

const printQueries = () => {
  console.log("[uniqueQueries] \n")

  for (const queryPattern of Array.from(uniqueQueries.keys()).sort()) {
    console.log(queryPattern, "[last request id] =", uniqueQueries.get(queryPattern))
  }
}

if (config.get("db.mongo.logQueries")) {
  process.on("SIGUSR1", () => {
    printQueries()
  })

  process.on("SIGINT", () => {
    printQueries()

    process.exit()
  })
}

export const ObjectId = OID
