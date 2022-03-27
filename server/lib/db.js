import { MongoClient } from "mongodb";
const connectionString = process.env.MONGODB_URI;
const client = new MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let dbConnection;

export function connectToDB(callback) {
  client.connect(function (err, db) {
    if (err || !db) {
      return callback(err);
    }

    // dbConnection = db.db("sample_db");
    dbConnection = db;
    console.log("Successfully connected to MongoDB.");

    return callback();
  });
};

export function getDb () {
  return dbConnection;
};