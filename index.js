/* Simplified stock exchange made with uWebSockets.js pub/sub */
import uWS from "uWebSockets.js";

import { default as buildWSRoutes } from "./routes/ws.js";

// get MongoDB driver connection
import { connectToDB } from "./lib/db.js";
import Minio from "./lib/storage/minio.js";
import S3 from "./lib/storage/s3.js";

let storageClient;
if (process.env.STORAGE_DRIVER === "minio") {
  storageClient = new Minio();
} else {
  storageClient = new S3();
}

const APP_OPTIONS = {};

const APP_PORT = 9001;

const WS_OPTIONS = {
  compression: uWS.SHARED_COMPRESSOR,
  maxPayloadLength: 16 * 1024 * 1024,
  idleTimeout: 12,
  maxBackpressure: 1024,
};

const APP = uWS.App(APP_OPTIONS);

buildWSRoutes(APP, WS_OPTIONS);

APP.listen(APP_PORT, (listenSocket) => {
  if (listenSocket) {
    console.log("Listening to port 9001");
  }
});

// perform a database connection when the server starts
connectToDB((err) => {
  if (err) {
    console.error("[connectToDB] Error", err);
    process.exit();
  } else {
    console.log("[connectToDB] Ok");
  }
});

export { storageClient };

// https://dev.to/mattkrick/replacing-express-with-uwebsockets-48ph
