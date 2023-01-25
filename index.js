/* Simplified stock exchange made with uWebSockets.js pub/sub */
import uWS from "uWebSockets.js";

import { default as buildWSRoutes } from "./routes/ws.js";

// get MongoDB driver connection
import { connectToDB } from "./lib/db.js";
import Minio from "./lib/storage/minio.js";
import S3 from "./lib/storage/s3.js";

//cache storage
import BlockListRepository from "./repositories/blocklist_repository.js";
import ConversationRepository from "./repositories/conversation_repository.js";
import NodeSharing from "./lib/node_sharing.js";
import os from "os";

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

buildWSRoutes(APP, WS_OPTIONS);

APP.listen(
  parseInt(process.env.APP_PORT),
  APP_LISTEN_OPTIONS,
  (listenSocket) => {
    if (listenSocket) {
      console.log("Listening to port 9001");
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
    await BlockListRepository.warmCache();
    await ConversationRepository.warmCache();

    const nodeParams = {
      ip_address: os.networkInterfaces(),
      hostname: os.hostname(),
    };
    await new NodeSharing(nodeParams).startSharing();
  }
});

export { storageClient };

// https://dev.to/mattkrick/replacing-express-with-uwebsockets-48ph
