/* Simplified stock exchange made with uWebSockets.js pub/sub */
const uWS = require('uWebSockets.js');
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf8');

const APP_OPTIONS = {

}

const APP_PORT = 9001;

const WS_OPTIONS = {
  compression: uWS.SHARED_COMPRESSOR,
  maxPayloadLength: 16 * 1024 * 1024,
  idleTimeout: 12,
  maxBackpressure: 1024,
}

uWS.App(APP_OPTIONS).ws('/*', {
  ...WS_OPTIONS,

  open: (ws) => {
    console.log('[open]', `IP: ${Buffer.from(ws.getRemoteAddressAsText()).toString()}`);

    ws.send('connected');
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