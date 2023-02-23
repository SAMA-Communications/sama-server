/* Simplified stock exchange made with uWebSockets.js pub/sub */
import uWS from "uWebSockets.js";

import { default as buildWSRoutes } from "./routes/ws.js";
import { clusterRoutes as buildClusterWSRoutes, setClusterPort } from "./cluster/cluster_manager.js";

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
const SSL_APP_OPTIONS = {
  key_file_name: process.env.SSL_KEY_FILE_NAME,
  cert_file_name: process.env.SSL_CERT_FILE_NAME,
};

const APP_LISTEN_OPTIONS = {
  LIBUS_LISTEN_EXCLUSIVE_PORT: 1
};

const WS_OPTIONS = {
  compression: uWS.SHARED_COMPRESSOR,
  idleTimeout: 12,
  maxBackpressure: 1024,
  maxPayloadLength: 16 * 1024 * 1024,
};

let CLIENT_SOCKET = null;
let CLUSTER_SOCKET = null;

if (SSL_APP_OPTIONS.key_file_name && SSL_APP_OPTIONS.cert_file_name) {
  CLIENT_SOCKET = uWS.SSLApp(SSL_APP_OPTIONS);
  CLUSTER_SOCKET = uWS.SSLApp(SSL_APP_OPTIONS);
} else {
  CLIENT_SOCKET = uWS.App(APP_OPTIONS);
  CLUSTER_SOCKET = uWS.App(APP_OPTIONS);
}

buildWSRoutes(CLIENT_SOCKET, WS_OPTIONS);

const appPort = parseInt(process.env.APP_PORT || process.env.PORT);
CLIENT_SOCKET.listen(
  appPort,
  APP_LISTEN_OPTIONS,
  (listenSocket) => {
    if (listenSocket) {
      console.log(`    APP listening on port ${uWS.us_socket_local_port(listenSocket)}, pid=${process.pid}`);
    } else {
      throw "CLIENT_SOCKET.listen error"
    }
  }
);

buildClusterWSRoutes(CLUSTER_SOCKET, WS_OPTIONS);

CLUSTER_SOCKET.listen(
  0,
  APP_LISTEN_OPTIONS,
  (listenSocket) => {
    if (listenSocket) {
      const clusterPort = uWS.us_socket_local_port(listenSocket);
      console.log(
        `CLUSTER listening on port ${clusterPort}`
      );
      setClusterPort(clusterPort)
    } else {
      throw "CLUSTER_SOCKET.listen error"
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
