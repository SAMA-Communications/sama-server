/* Simplified stock exchange made with uWebSockets.js pub/sub */
import uWS from 'uWebSockets.js';
import { StringDecoder } from 'string_decoder';
const decoder = new StringDecoder('utf8');

import {default as buildUsersRoutes} from './routes/users.js';

// get MongoDB driver connection
import { connectToDB } from './lib/db.js';

const APP_OPTIONS = {

}

const APP_PORT = 9001;

const WS_OPTIONS = {
  compression: uWS.SHARED_COMPRESSOR,
  maxPayloadLength: 16 * 1024 * 1024,
  idleTimeout: 12,
  maxBackpressure: 1024,
}

const ACTIVE_SESSIONS = {};

const APP = uWS.App(APP_OPTIONS)
APP.ws('/*', {
  ...WS_OPTIONS,

  open: (ws) => {
    console.log('[open]', `IP: ${Buffer.from(ws.getRemoteAddressAsText()).toString()}`);

    ACTIVE_SESSIONS[ws] = {};

    ws.send('connected');
  },

  close: (ws, code, message) => {
    delete ACTIVE_SESSIONS[ws];
  },

	message: (ws, message, isBinary) => {
		// const json = JSON.parse(decoder.write(Buffer.from(message)));
    const text = Buffer.from(message).toString();
    console.log('[message]: ' + text);
    ws.send(text);
	}
}).listen(APP_PORT, (listenSocket) => {
	if (listenSocket) {
		console.log('Listening to port 9001');
	}
});
buildUsersRoutes(APP);


// perform a database connection when the server starts
connectToDB(err => {
  if (err) {
    console.error('[connectToDB] Error', err);
    process.exit();
  } else {
    console.log('[connectToDB] Ok');
  }
});


// https://dev.to/mattkrick/replacing-express-with-uwebsockets-48ph