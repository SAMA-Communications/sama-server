/* Simplified stock exchange made with uWebSockets.js pub/sub */
import uWS from "uWebSockets.js";

import { default as buildWSRoutes } from "./routes/ws.js";
import { default as buildClusterWSRoutes } from "./routes/cluster_ws.js";

// get MongoDB driver connection
import { connectToDB } from "./lib/db.js";
import Minio from "./lib/storage/minio.js";
import S3 from "./lib/storage/s3.js";

//cache storage
import BlockListRepository from "./repositories/blocklist_repository.js";
import ConversationRepository from "./repositories/conversation_repository.js";
import RedisClient from "./lib/redis.js";
import ClusterClient from "./lib/node_sharing.js";

let storageClient;
if (process.env.STORAGE_DRIVER === "minio") {
  storageClient = new Minio();
} else {
  storageClient = new S3();
}

const APP_OPTIONS = {};

const APP_LISTEN_OPTIONS = {
  LIBUS_LISTEN_EXCLUSIVE_PORT: 1,
};

const WS_OPTIONS = {
  compression: uWS.SHARED_COMPRESSOR,
  idleTimeout: 12,
  maxBackpressure: 1024,
  maxPayloadLength: 16 * 1024 * 1024,
};

const APP = uWS.App(APP_OPTIONS);
APP.connect("/*", (req, res) => {
  console.log(req, res);
});

buildWSRoutes(APP, WS_OPTIONS);

APP.listen(
  parseInt(process.env.APP_PORT),
  APP_LISTEN_OPTIONS,
  (listenSocket) => {
    if (listenSocket) {
      console.log(`Listening to port ${process.env.APP_PORT}`);
    }
  }
);

const APP_FOR_LISTEN = uWS.App(APP_OPTIONS);

buildClusterWSRoutes(APP_FOR_LISTEN, WS_OPTIONS);

APP_FOR_LISTEN.listen(
  parseInt(process.env.APP_PORT) + 100,
  APP_LISTEN_OPTIONS,
  (listenSocket) => {
    if (listenSocket) {
      console.log(`Listening to port ${parseInt(process.env.APP_PORT) + 100}`);
    }
  }
);

// perform a database connection when the server starts
connectToDB(async (err) => {
  if (err) {
    console.error("[connectToDB] Error", err);
    process.exit();
  } else {
    console.log("[connectToDB] Ok");
    await ClusterClient.startSyncingClusterNodes();
    await RedisClient.connect();
    //need to delete cluster record when node shut down
    await BlockListRepository.warmCache();
    await ConversationRepository.warmCache();
  }
});

export { storageClient };

// https://dev.to/mattkrick/replacing-express-with-uwebsockets-48ph
