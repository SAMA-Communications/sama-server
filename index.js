/* Simplified stock exchange made with uWebSockets.js pub/sub */
import uWS from "uWebSockets.js";

import clientManager from "./app/routes/client_manager.js";
import clusterManager from "./app/cluster/cluster_manager.js";

// get MongoDB driver connection
import { connectToDB } from "./app/lib/db.js";
import Minio from "./app/lib/storage/minio.js";
import S3 from "./app/lib/storage/s3.js";

//cache storage
import BlockListRepository from "./app/repositories/blocklist_repository.js";
import ConversationRepository from "./app/repositories/conversation_repository.js";
import RedisClient from "./app/lib/redis.js";
import ClusterSyncer from "./app/cluster/cluster_syncer.js";

let storageClient;
if (process.env.STORAGE_DRIVER === "minio") {
  storageClient = new Minio();
} else {
  storageClient = new S3();
}

const APP_OPTIONS = {};
const SSL_APP_OPTIONS = {
  key_file_name: process.env.SSL_KEY_FILE_NAME,
  cert_file_name: process.env.SSL_CERT_FILE_NAME,
};
const WS_OPTIONS = {
  compression: uWS.SHARED_COMPRESSOR,
  idleTimeout: 12,
  maxBackpressure: 1024,
  maxPayloadLength: 16 * 1024 * 1024,
};
const WS_LISTEN_OPTIONS = {
  LIBUS_LISTEN_EXCLUSIVE_PORT: 1,
};

const isSSL = !!SSL_APP_OPTIONS.key_file_name && !!SSL_APP_OPTIONS.cert_file_name;

const appPort = parseInt(process.env.APP_PORT || process.env.PORT);
clientManager.createLocalSocket(isSSL ? SSL_APP_OPTIONS : APP_OPTIONS, WS_OPTIONS, WS_LISTEN_OPTIONS, isSSL, appPort);
//
clusterManager.createLocalSocket(isSSL ? SSL_APP_OPTIONS : APP_OPTIONS, WS_OPTIONS, WS_LISTEN_OPTIONS, isSSL);

// perform a database connection when the server starts
connectToDB(async (err) => {
  if (err) {
    console.error("[connectToDB] Error", err);
    process.exit();
  } else {
    console.log("[connectToDB] Ok");
    await ClusterSyncer.startSyncingClusterNodes();
    await RedisClient.connect();
    await BlockListRepository.warmCache();
    await ConversationRepository.warmCache();
  }
});

export { storageClient };

// https://dev.to/mattkrick/replacing-express-with-uwebsockets-48ph
