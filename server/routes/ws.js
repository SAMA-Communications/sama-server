const ACTIVE_SESSIONS = {};

export default function routes(app, wsOptions) {
  app.ws('/*', {
    ...wsOptions,
  
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
  })
}